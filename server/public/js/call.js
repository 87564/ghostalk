import { setupConnection } from './webrtc.js';

const urlParams = new URLSearchParams(window.location.search);
const room = urlParams.get('room');

setupConnection(room);
