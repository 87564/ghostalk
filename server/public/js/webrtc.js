import { maskAudioStream } from './voiceMask.js';

let socket = io();
let peerConnection;
let localStream;

export async function setupConnection(room) {
    // Step 1: Get mic access first
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Got local mic stream:', localStream);

    // Step 2: Apply voice masking
    localStream = await maskAudioStream(localStream);
    console.log('Applied voice masking');

    // Step 3: Create PeerConnection
    peerConnection = new RTCPeerConnection();

    // Step 4: Add masked tracks from mic to PeerConnection
    localStream.getTracks().forEach(track => {
        console.log('Adding masked local track:', track);
        peerConnection.addTrack(track, localStream);
    });

    // Step 5: Now start socket signaling
    socket.emit('join', room);

    socket.on('peer-joined', async peerId => {
        console.log('Peer joined:', peerId);
        await createOffer(peerId);
    });

    // Step 6: Correctly separate offer/answer vs ICE candidates
    socket.on('signal', async ({ from, signal }) => {
        console.log('Received signal from:', from, signal);

        if (signal.type === 'offer') {
            await createAnswer(from, signal);
        } else if (signal.type === 'answer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(signal));
        }
    });

    // Step 7: Handle ICE candidates
    peerConnection.onicecandidate = e => {
        if (e.candidate) {
            socket.emit('signal', { to: room, from: socket.id, signal: e.candidate });
        }
    };

    // Step 8: Receiving remote tracks
    peerConnection.ontrack = event => {
        console.log('Received remote track:', event.streams);

        let remoteAudio = document.getElementById('remoteAudio');
        if (!remoteAudio) {
            remoteAudio = document.createElement('audio');
            remoteAudio.id = 'remoteAudio';
            remoteAudio.autoplay = true;
            remoteAudio.controls = false;
            document.body.appendChild(remoteAudio);
        }

        remoteAudio.srcObject = event.streams[0];

        remoteAudio.play()
            .then(() => {
                console.log('Remote audio playing!');
            })
            .catch(err => {
                console.error('Remote audio play failed:', err);
            });
    };
}

async function createOffer(peerId) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('signal', { to: peerId, from: socket.id, signal: offer });
}

async function createAnswer(peerId, offer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('signal', { to: peerId, from: socket.id, signal: answer });
}
