let exporter1, exporter2;

// Load audio file
document.getElementById('audioUpload1').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(e.target.result, (buffer) => {
                const audioData = new Float32Array(buffer.getChannelData(0));
                exporter1 = new FloatExporter(audioData, buffer.sampleRate);
            });
        };
        reader.readAsArrayBuffer(file);
    }
});
document.getElementById('audioUpload2').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(e.target.result, (buffer) => {
                const audioData = new Float32Array(buffer.getChannelData(0));
                exporter2 = new FloatExporter(audioData, buffer.sampleRate);
            });
        };
        reader.readAsArrayBuffer(file);
    }
});

// Apply effects
document.getElementById('combine').addEventListener('click', function() {
    if (exporter1 && exporter2) {
        exporter1.FX.uhohthisbad(exporter2, true);
        exporter2 = [];
        const wavBlob = exporter1.convertToWav('blob');
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
    const url = document.getElementById('audioEditor').src;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modified-audio.wav';
    a.click();
    a.remove();
});
