class FloatExporter {
	constructor(audioData = new Float32Array([]), sampleRate = 48000) {
		if (!(audioData instanceof Float32Array)) {
			console.warn("The audioData must be a Float32Array. Otherwise, the audio data is automatically empty");
			this.audioData = new Float32Array([]);
		} else {
			this.audioData = audioData;
		}
		if (typeof sampleRate !== "number") {
			console.warn("The sample rate must be a number, not a '" + (typeof sampleRate) + "'")
			sampleRate = 48000;
		} else {
			if (sampleRate === 0) {
				console.warn("The sample rate must not be 0, which this problem unsolved can cause infinitely long audio")
				sampleRate = 48000;
			}
			if (sampleRate < 0) console.warn("The sample rate cannot be ≤ 0, though this case is handled")
		}
		if (sampleRate % 1 !== 0) {
			console.warn("The sample rate isn't rounded, but this case is handled")
		}
		this.sampleRate = Math.abs(Math.round(sampleRate));
	}
	convertToWav(exp = "blob") {
		const numChannels = 1, ch1 = 32767, ch2 = 32768, ch3 = 0, ch4 = -1, ch5 = 1, len = this.audioData.length;
		const len2 = len * 2;
		const buffer = new ArrayBuffer(44 + len2);
		const view = new DataView(buffer);
		this.writeString(view, 0, 'RIFF');
		view.setUint32(4, 36 + len2, true);
		this.writeString(view, 8, 'WAVE');
		this.writeString(view, 12, 'fmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, numChannels, true);
		view.setUint32(24, this.sampleRate, true);
		view.setUint32(28, this.sampleRate * 2, true);
		view.setUint16(32, 2, true);
		view.setUint16(34, 16, true);
		this.writeString(view, 36, 'data');
		view.setUint32(40, len2, true);
		let offset = 44, s;
		for (let i = 0; i !== len; i++) {
			s = Math.max(ch4, Math.min(ch5, this.audioData[i]));
			view.setInt16(offset, s < ch3 ? s * ch2 : s * ch1, true);
			offset += 2;
		}
		return exp === "blob" ? new Blob([view], { type: 'audio/wav' }) : exp === "dataview" ? view : undefined;
	}
	writeString(view, offset, string) {
		for (let i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	}
	static sineWave(frequency, duration, sampleRate) {
		const array = new Float32Array(Math.floor(duration * sampleRate))
		const len = array.length, cache = 2 * Math.PI
		for (let i = 0; i !== len; i++) {
			array[i] = Math.sin((cache * frequency * i) / sampleRate)
		}
		return new FloatExporter(array, sampleRate)
	}
	version = 0;
}
