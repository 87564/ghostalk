export async function maskAudioStream(stream) {
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);

  // Create a Gain Node to adjust output volume
  const gainNode = audioContext.createGain();
  gainNode.gain.setValueAtTime(1, audioContext.currentTime);

  // Create a playback rate hack using an AudioBufferSourceNode
  const processor = audioContext.createScriptProcessor(1024, 1, 1);

  processor.onaudioprocess = function(e) {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);

      for (let i = 0; i < input.length; i++) {
          // Basic hack: skip samples to make voice higher pitched
          output[i] = input[Math.floor(i / 1.5)] || 0;
      }
  };

  const destination = audioContext.createMediaStreamDestination();

  source.connect(gainNode);
  gainNode.connect(processor);
  processor.connect(destination);

  return destination.stream;
}
