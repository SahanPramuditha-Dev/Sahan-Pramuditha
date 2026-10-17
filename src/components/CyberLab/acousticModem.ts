// Acoustic FSK Modem for Real-time Speaker-to-Mic Transmission
// Uses audible or near-ultrasonic dual frequencies to transmit characters over the air.

// Frequencies (in Hz)
// We use high audio frequencies that speakers/microphones easily reproduce (16000Hz - 18000Hz)
export const FREQ_MARK = 16500;  // Binary 1
export const FREQ_SPACE = 15200; // Binary 0
export const FREQ_START = 17500; // Transmission preamble / framing tone

export const BIT_DURATION_MS = 35; // Duration of each bit in milliseconds

export class AcousticTransmitter {
  private ctx: AudioContext | null = null;

  constructor() {
    this.ctx = null;
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Modulate message into audio tones and play through speakers
  async transmit(message: string, onProgress?: (percent: number) => void): Promise<void> {
    this.initCtx();
    if (!this.ctx) return;

    const enc = new TextEncoder();
    const bytes = enc.encode(message);

    // Convert bytes into bit array with start/stop bits
    const bits: number[] = [];
    
    // Preamble tones (3 start marker pulses)
    for (let p = 0; p < 4; p++) bits.push(2);

    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      for (let bit = 7; bit >= 0; bit--) {
        bits.push((b >> bit) & 1);
      }
    }

    // Postamble
    for (let p = 0; p < 2; p++) bits.push(2);

    const now = this.ctx.currentTime + 0.05;
    const bitDurationSec = BIT_DURATION_MS / 1000;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.02);

    bits.forEach((bitVal, idx) => {
      const bitTime = now + (idx * bitDurationSec);
      let targetFreq = FREQ_SPACE;
      if (bitVal === 1) targetFreq = FREQ_MARK;
      if (bitVal === 2) targetFreq = FREQ_START;

      osc.frequency.setValueAtTime(targetFreq, bitTime);
    });

    const endTime = now + (bits.length * bitDurationSec);
    gain.gain.setValueAtTime(0.35, endTime - 0.02);
    gain.gain.linearRampToValueAtTime(0.0001, endTime);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(endTime);

    // Progress updates
    const totalDuration = endTime - now;
    const startTime = Date.now();
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const pct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
        onProgress?.(pct);
        if (elapsed >= totalDuration) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }
}

export class AcousticReceiver {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private isListening = false;
  private animFrameId: number | null = null;

  async startListening(
    onCharReceived: (char: string) => void,
    onStatus: (status: string, activeFreq?: number) => void
  ): Promise<void> {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    });

    const source = this.ctx.createMediaStreamSource(this.micStream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.2;
    source.connect(this.analyser);

    this.isListening = true;
    const bufferLength = this.analyser.frequencyBinCount;
    const freqData = new Float32Array(bufferLength);
    const sampleRate = this.ctx.sampleRate;

    const binMark = Math.round((FREQ_MARK * this.analyser.fftSize) / sampleRate);
    const binSpace = Math.round((FREQ_SPACE * this.analyser.fftSize) / sampleRate);
    const binStart = Math.round((FREQ_START * this.analyser.fftSize) / sampleRate);

    let state: 'WAIT_PREAMBLE' | 'RECEIVING' = 'WAIT_PREAMBLE';
    let currentBits: number[] = [];
    let preambleCount = 0;
    let lastBitTime = 0;

    const loop = () => {
      if (!this.isListening || !this.analyser) return;
      this.analyser.getFloatFrequencyData(freqData);

      const ampMark = freqData[binMark];
      const ampSpace = freqData[binSpace];
      const ampStart = freqData[binStart];
      const threshold = -85; // dB threshold

      const now = Date.now();

      if (ampStart > threshold && ampStart > ampMark && ampStart > ampSpace) {
        onStatus('Synchronizing signal carrier...', FREQ_START);
        if (state === 'WAIT_PREAMBLE') {
          preambleCount++;
          if (preambleCount >= 2) {
            state = 'RECEIVING';
            currentBits = [];
            lastBitTime = now;
            onStatus('Intercepting transmission stream...');
          }
        }
      } else if (state === 'RECEIVING' && (now - lastBitTime) >= (BIT_DURATION_MS * 0.8)) {
        if (ampMark > threshold || ampSpace > threshold) {
          const bit = ampMark > ampSpace ? 1 : 0;
          currentBits.push(bit);
          lastBitTime = now;
          onStatus(`Receiving bit ${bit}...`, bit === 1 ? FREQ_MARK : FREQ_SPACE);

          if (currentBits.length === 8) {
            let byteVal = 0;
            for (let b = 0; b < 8; b++) {
              byteVal = (byteVal << 1) | currentBits[b];
            }
            if (byteVal >= 32 && byteVal <= 126) {
              const char = String.fromCharCode(byteVal);
              onCharReceived(char);
            }
            currentBits = [];
          }
        }
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  stopListening(): void {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
