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
				const array = [...this.audioData]
				for (let i = 0; i < array.length; i++) {
					array[i] *= multiplier
				}
				this.audioData = new Float32Array(array)
			},
			speed: (multiplier, interpolate = false) => {
				const array = [...this.audioData]
				let changedArray = new Float32Array(Math.ceil(array.length * (1 / multiplier)))
				if (multiplier !== 1) {
					if (multiplier >= array.length) {
						console.warn("The audio will be practically unhearable if it's multiplier is bigger than the audio's buffer size. Returning an empty buffer now.")
						this.audioData = new Float32Array([])
						return
					} else if (multiplier <= 0) {
						console.warn("The audio module would freeze if the multiplier is ≤ 0. Did you mean to use", multiplier * -1, "for the multiplier instead?")
						return
					}
					let j = 0
					if (interpolate) {
						let f, e
						for (let i = 0; i < changedArray.length; i += multiplier) {
							f = i % 1
							e = Math.round(i)
							if (f === 0) {
								changedArray[e] = array[j]
							} else {
								const prev = (array[e - 1] || 0) * (1 - f), next = (array[e + 1] || 0) * f
								changedArray[e] = (prev + next) / 2
							}
							j++
						}
					} else {
						for (let i = 0; i < changedArray.length; i += multiplier) {
							changedArray[Math.round(i)] = array[j]
							j++
						}
					}
					this.audioData = new Float32Array(changedArray)
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
		let offset = 44;
		for (let i = 0; i < this.audioData.length; i++) {
			const s = Math.max(-1, Math.min(1, this.audioData[i]));
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
