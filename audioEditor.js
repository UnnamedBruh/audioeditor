const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let exporter = null;
let audioBuffer = null;
let sourceNode = null;

// Load audio file
document.getElementById('audioFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const arrayBuffer = await file.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const floatData = new Float32Array(audioBuffer.getChannelData(0)); // Assuming mono audio for simplicity
    exporter = new FloatExporter(floatData, audioContext.sampleRate);
});

// Playback controls
document.getElementById('play').addEventListener('click', () => {
    if (sourceNode) {
        sourceNode.stop();
    }
    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(audioContext.destination);
    sourceNode.start(0);
});

document.getElementById('pause').addEventListener('click', () => {
    if (sourceNode) {
        sourceNode.stop();
    }
});

// Apply gain
document.getElementById('gain').addEventListener('input', (event) => {
    const gainValue = parseFloat(event.target.value);
    if (exporter) {
        exporter.FX.gain(gainValue);
    }
});

// Apply speed
document.getElementById('speed').addEventListener('change', (event) => {
    const speedValue = parseFloat(event.target.value);
    if (exporter) {
        exporter.FX.speed(speedValue, true);
    }
});

// Export to WAV
document.getElementById('export').addEventListener('click', () => {
    if (exporter) {
        const wavBlob = exporter.convertToWav('blob');
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'output.wav';
        a.click();
        URL.revokeObjectURL(url); // Clean up
    }
});
