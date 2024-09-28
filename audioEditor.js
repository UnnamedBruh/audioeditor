let exporter;

// Load audio file
document.getElementById('audioUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(e.target.result, (buffer) => {
                const audioData = new Float32Array(buffer.getChannelData(0)); // Assuming mono audio
                exporter = new FloatExporter(audioData, buffer.sampleRate);
                console.log("Audio loaded.");
            });
        };
        reader.readAsArrayBuffer(file);
    }
});

// Apply effects
document.getElementById('applyEffects').addEventListener('click', function() {
    if (exporter) {
        const gainValue = parseFloat(document.getElementById('gainSlider').value);
        const speedValue = parseFloat(document.getElementById('speedSlider').value);
        
        exporter.FX.gain(gainValue);
        exporter.FX.speed(speedValue, true);

        // Update the audio player
        const wavBlob = exporter.convertToWav('blob');
        const audioUrl = URL.createObjectURL(wavBlob);
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer.src) {
            URL.revokeObjectURL(audioPlayer.src)
        }
        audioPlayer.src = audioUrl;
        audioPlayer.play();
    } else {
        alert("Please upload an audio file first.");
    }
});

// Download WAV file
document.getElementById('downloadWav').addEventListener('click', function() {
    if (exporter) {
        const wavBlob = exporter.convertToWav('blob');
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modified-audio.wav';
        a.click();
        URL.revokeObjectURL(url);
    } else {
        alert("Please upload an audio file first.");
    }
});
