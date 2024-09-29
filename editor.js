class FloatExporter {
	constructor(audioData = new Float32Array([]), sampleRate = 48000) {
		if (!(audioData instanceof Float32Array)) {
			console.error("Input must be a Float32Array.");
			this.audioData = new Float32Array([]);
		} else {
			this.audioData = audioData;
		}
		this.sampleRate = sampleRate;
		this.backupData = new Float32Array(this.audioData);
		this.FX = {
			gain: multiplier => {
				if (multiplier === 1) return;
				if (multiplier === 0) {
					this.audioData.fill(0)
					return
				}
				const de = this.audioData.length
				for (let i = 0; i !== de; i++) {
					this.audioData[i] *= multiplier
				}
			},
			speed: multiplier => {
				if (multiplier !== 1) {
					let len = this.audioData.length
					if (multiplier >= len) {
						console.warn("The audio will be practically unhearable if its multiplier is bigger than the audio's buffer size. Returning an empty buffer now.");
						this.audioData = new Float32Array([]);
						return;
					} else if (multiplier <= 0) {
						multiplier *= -1
						console.warn("The module would crash and the audio will be reversed if the multiplier would be ≤ 0. Did you mean to use", multiplier, "for the multiplier instead?");
					}
					const changedArray = new Float32Array(Math.ceil(this.audioData.length * (1 / multiplier)));
					len = changedArray.length
					for (let i = 0; i !== len; i++) {
						changedArray[i] = this.audioData[Math.floor(i * multiplier)];
					}
					this.audioData = changedArray;
				}
			}
		}
	}
	convertToWav(exp = "blob") {
		const numChannels = 1;
		const buffer = new ArrayBuffer(44 + this.audioData.length * 2);
		const view = new DataView(buffer);
		this.writeString(view, 0, 'RIFF');
		view.setUint32(4, 36 + this.audioData.length * 2, true);
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
		view.setUint32(40, this.audioData.length * 2, true);
		let offset = 44, s;
		for (let i = 0; i < this.audioData.length; i++) {
			s = Math.max(-1, Math.min(1, this.audioData[i]));
			view.setInt16(offset, s < 0 ? s * 32768 : s * 32767, true);
			offset += 2;
		}
		return exp === "blob" ? new Blob([view], { type: 'audio/wav' }) : exp === "dataview" ? view : undefined;
	}
	writeString(view, offset, string) {
		for (let i = 0; i < string.length; i++) {
			view.setUint8(offset + i, string.charCodeAt(i));
		}
	}
}
