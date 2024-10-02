var FloatExporter = (function() {
	function isNumber(msg, v) {
		if (typeof v !== "number") {
			throw new Error(msg + " must be a number, not a '" + (typeof v) + "'")
		}
	}
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
			this.backupData = new Float32Array(this.audioData);
			this.FX = {
				gain: multiplier => {
					isNumber("The volume multiplier", multiplier)
					if (multiplier === 1) return false;
					if (multiplier === 0) {
						this.audioData.fill(0)
						return true;
					}
					const de = this.audioData.length
					for (let i = 0; i !== de; i++) {
						this.audioData[i] *= multiplier
					}
					return true
				},
				speed: multiplier => {
					isNumber("The speed multiplier", multiplier)
					if (multiplier === 1 || multiplier === -1) {
						return false;
					} else {
						let len = this.audioData.length;
						if (multiplier >= len) {
							console.warn("The audio will be practically unhearable if its multiplier is bigger than the audio's buffer size. Returning an empty buffer now.");
							this.audioData = new Float32Array([]);
							return false;
						} else if (multiplier === 0) {
							throw new Error("The multiplier cannot be 0, because if it is, the environment would freeze and the environment would have a memory overflow. This was prevented so the environment wouldn't crash.");
						} else if (multiplier < 0) {
							multiplier *= -1
							console.warn("The module would crash and the audio will be reversed if the multiplier would be ≤ 0. Did you mean to use", multiplier, "for the multiplier instead?");
						}
						const changedArray = new Float32Array(Math.ceil(this.audioData.length * (1 / multiplier)));
						len = changedArray.length
						for (let i = 0; i !== len; i++) {
							changedArray[i] = this.audioData[Math.floor(i * multiplier)];
						}
						this.audioData = changedArray;
						return true;
					}
				},
				distort: () => {
					const de = this.audioData.length;
					if (de === 0) return false;
					if (de === 1) {
						this.audioData[0] = Math.tanh(this.audioData[0])
						return true;
					}
					for (let i = 0; i !== de; i++) {
						this.audioData[i] = Math.tanh(this.audioData[i]);
					}
					return true;
				},
				quantize: bits => {
					isNumber("The bits limiter", bits)
					const de = this.audioData.length;
					if (de === 0) return false;
					const step = Math.pow(2, -bits);
					if (de === 1) {
						this.audioData[0] = Math.round(this.audioData[0] / step) * step;
						return true;
					}
					for (let i = 0; i !== de; i++) {
						this.audioData[i] = Math.round(this.audioData[i] / step) * step;
					}
					return true;
				},
				reduceFrequency: _ => {
					console.warn("This effect can be computationally slower than other methods! You can use it anyway after this warning, though")
					this.FX.reduceFrequency = sample => {
						if (sample == undefined) {
							return
						}
						isNumber("The samples factor", sample)
						if (sample > 0 && sample <= 1) {
							console.warn("The sample input must not be ≤ 1. Otherwise, the audio will not be affected very well")
							return false
						} else if (sample <= 0) {
							throw new Error("The sample is ≤ 0, which can cause an infinite loop for the 'reduceFrequency' effect, and potentially cause a memory overflow (reversing the audio infinitely)")
						}
						const de = this.audioData.length;
						if (de === 1 || de === 0) return false;
						const s = Math.ceil(sample) - 1
						let c, e;
						for (let j = 0; j < de; j += sample) {
							c = this.audioData[(e = Math.floor(j))];
							for (let i = 0; i !== s && i + j < de; i++) {
								this.audioData[i + e] = c;
							}
						}
						return true;
					}
					return "effect can be used after warning";
				},
				doubleSpeed: () => {
					let len = this.audioData.length;
					const leng = Math.ceil(len / 2);
					if (leng === 1) return false;
					const changedArray = new Float32Array(leng);
					len = changedArray.length
					let j = 0
					for (let i = 0; i !== len; i++) {
						changedArray[i] = (this.audioData[j] + this.audioData[j + 1]) / 2;
						j += 2
					}
					this.audioData = changedArray;
					return true;
				},
				distort2: level => {
					if (level === 0) {
						throw new Error("The level cannot be 0, because of the infinite values that can be achieved.")
					}
					const len = this.audioData.length;
					if (len === 0) {
						return false;
					} else if (len === 1) {
						const c = this.audioData[0]
						this.audioData[0] = c !== 0 ? c / (c > 0 ? Math.ceil(c * level) / level : -(Math.ceil(-c * level) / level)) : 1
						return true;
					}
					const z = 0, o = 1
					let c
					for (let i = 0; i !== len; i++) {
						c = this.audioData[i]
						this.audioData[i] = c !== z ? c / (c > z ? Math.ceil(c * level) / level : -(Math.ceil(-c * level) / level)) : o
					}
					return true;
				},
				distort3: () => {
					const len = this.audioData.length
					let c
					for (let i = 0; i !== len; i++) {
						this.audioData[i] *= this.audioData[i]
					}
					return true;
				},
				distort4: level => {
					if (level === 0) {
						return false;
					}
					if (level % 1 !== 0) {
						console.warn("The level must be a whole number currently. A specific feature could support decimals in a future update.")
						level = Math.round(level)
					}
					if (level < 0) {
						console.warn("The level must be positive.")
						level *= -1
					}
					const len = this.audioData.length
					let c
					for (let i = 0; i !== len; i++) {
						for (let j = 0; j !== level; j++) {
							this.audioData[i] = Math.sqrt(this.audioData[i])
						}
					}
					return true;
				},
				reverse: () => {
					this.audioData = this.audioData.reverse()
				},
				overlap: (exporter, sampleRateEvened = true) => {
					const de = this.audioData.length, di = exporter.audioData.length
					if (de.sampleRate !== di.sampleRate && sampleRateEvened) {
						di.FX.speed(1 / Math.abs(this.sampleRate / exporter.sampleRate))
					}
					const arr = de > di
					if (arr) {
						for (let i = 0; i < di; i++) {
							this.audioData[i] += exporter.audioData[i]
						}
					} else {
						for (let i = 0; i < de; i++) {
							exporter.audioData[i] += this.audioData[i]
						}
						this.audioData = new Float32Array(exporter.audioData)
					}
					return true
				},
				echo: (layers = 3, delay = 1000) => {
					if (layers < 0) {
						throw new Error("There must be a number of layers ≥ 0. Otherwise, the environment would freeze and a memory leak is caused")
					} else if (layers === 0) {
						return false
					} else if (layers % 1 !== 0) {
						console.warn("The layers must be rounded for valid echoes in the audio")
						layers = Math.ceil(layers)
					}
					delay = Math.ceil(delay)
					const de = this.audioData.length, di = this.audioData.length + layers * delay, la = layers + 1;
					const arr = new Float32Array(this.audioData);
					let on, no
					for (let j = 1; j !== la; j++) {
						on = j * delay
						no = j + 1
						for (let i = 0; i !== de; i++) {
							arr[i + on] += this.audioData[i] / no
						}
					}
					this.audioData = arr
					return true
				},
				sine: () => {
					console.warn("This is a computationally slower effect compared to other effects! Make sure you use with caution")
					const de = this.audioData.length
					if (de === 0) return false
					const s = 2 * Math.PI
					for (let i = 0; i !== de; i++) {
						this.audioData[i] = Math.sin((s * (Math.abs(this.audioData[i]) * 2048) / this.sampleRate) * i)
					}
					return true
				}
			}
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
		restore() {
			this.audioData = this.backupData;
			this.backupData = Float32Array.from(this.backupData);
		}
		static sineWave(frequency, duration, sampleRate) {
			const array = new Float32Array(Math.floor(duration * sampleRate))
			const len = array.length, cache = 2 * Math.PI
			for (let i = 0; i !== len; i++) {
				array[i] = Math.sin((cache * frequency * i) / sampleRate)
			}
			return new FloatExporter(array, sampleRate)
		}
		static help(indicators) {
			if (indicators) {
				switch (indicators) {
					case "fx gain":
						console.log("{FloatExporter Class}.FX.gain multiplies the audio's volume by a single parameter:\n- multiplier: The multiplier that is used to multiply the audio's volume. For example, 0.5 halfens the audio's volume, while 2 doubles the audio's volume.\nWARNING: Keep in mind that very high values may result in distorted and extremely loud sound!")
						break
					case "fx speed":
						console.log("{FloatExporter Class}.FX.speed divides the audio's sound duration, and multiplies the audio's pitch by a single parameter:\n- multiplier: The multiplier that is used to speed up or slow down the audio. For example, 0.5 slows down the audio, while 2 speeds up the audio.\nNOTE: Applying multiple of this effect would result in slightly choppy/pixely audio!\nWARNING: Keep in mind that very low values result in very long sound!")
						break
					case "fx distort":
						console.log("{FloatExporter Class}.FX.distort distorts the audio without making it very loud, and it doesn't have any parameters.\nWARNING: This effect is irreversable, unless you use the {FloatExporter Class}.restore function to restore the original sound!")
						break
					case "fx reduceFrequency":
						console.log("{FloatExporter Class}.FX.reduceFrequency uses a single parameter to lower the audio frequecies:\n- sample: The sample factor that would determine how low the frequencies should be. For example, 6 results in slightly low frequencies, while 32 results in incomprehensible audio.\nNOTE: You may get a warning from using this effect only ONCE.\nWARNING: This effect is irreversible, and is also resource-intensive! Make sure to apply this to shorter sounds!")
						break
					case "fx quantize":
						console.log("{FloatExporter Class}.FX.quantize uses a single parameter to limit the data to (bits ** 4) possible values:\n- bits: The value to limit the possible values in. For example, 16 results in slightly staticy audio, while 4 results in very staticy audio.\nWARNING: This effect is irreversible, and can limit the ability to understand the audio!")
						break
					case "fx doubleSpeed":
						console.log("{FloatExporter Class}.FX.doubleSpeed multiplies the audio's speed by 2, but averages two values at a time. This is an alternative to {FloatExporter Class}.FX.speed(2).\nNOTE: This is slightly resource-intensive, because of the process of summing two values at a time and normalizing them!")
						break
					default:
						console.warn("This directory doesn't exist yet. Perhaps it may get added soon.")
				}
			} else {
				console.log("This function is supposed to help you understand how the module works, and how the effects are applied to the module. Here are all of the possible values that can be achieved:\n- 'fx gain'\n- 'fx speed'\n- 'fx distort'\n- 'fx quantize'\n- 'fx reduceFrequency'\n- 'fx doubleSpeed'")
			}
		}
		version = 0;
	}
	return FloatExporter
})()
