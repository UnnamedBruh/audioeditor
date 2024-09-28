let audioContext;
let audioBuffer;
let exporter;

// Load audio data from file
document.getElementById('audioUpload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const arrayBuffer = await file.arrayBuffer();
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Convert audio buffer to Float32Array
        const floatData = new Float32Array(audioBuffer.getChannelData(0));
        exporter = new FloatExporter(floatData, audioContext.sampleRate);

        // Load audio into the player
        document.getElementById('audioPlayer').src = URL.createObjectURL(file);
    }
});

// Apply effects to the audio
document.getElementById('applyEffects').addEventListener('click', () => {
    const gainValue = parseFloat(document.getElementById('gain').value);
    const speedMultiplier = parseFloat(document.getElementById('speed').value);
    const interpolate = document.getElementById('interpolate').checked;

    exporter.FX.gain(gainValue);
    exporter.FX.speed(speedMultiplier, interpolate);
});

// Download the processed audio as WAV
document.getElementById('downloadWav').addEventListener('click', () => {
    if (exporter) {
        const wavBlob = exporter.convertToWav("blob");
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'processed_audio.wav';
        a.click();
        URL.revokeObjectURL(url);
    } else {
        alert('Please upload an audio file first.');
    }
});
