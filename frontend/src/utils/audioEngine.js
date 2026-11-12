class AudioEngine {
  constructor() {
    this.sfxEnabled = true;
    this.autoTtsEnabled = false;
    this.audioCtx = null;
    this.ttsSupported = false;
  }

  _initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    if (this.sfxEnabled) this.playPop();
    return this.sfxEnabled;
  }

  toggleAutoTts() {
    this.autoTtsEnabled = false;
    return false;
  }

  playPop() {
    if (!this.sfxEnabled) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.12);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  playCorrect() {
    if (!this.sfxEnabled) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = this.audioCtx.currentTime + idx * 0.09;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      });
    } catch {}
  }

  playWrong() {
    if (!this.sfxEnabled) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(210, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  playTick(isFinal = false) {
    if (!this.sfxEnabled) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 880 : 587.33, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.35 : 0.09));
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + (isFinal ? 0.36 : 0.1));
    } catch {}
  }

  playCelebration() {
    if (!this.sfxEnabled) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;
      const melody = [
        { f: 523.25, t: 0.0, d: 0.15 },
        { f: 659.25, t: 0.14, d: 0.15 },
        { f: 783.99, t: 0.28, d: 0.15 },
        { f: 1046.5, t: 0.42, d: 0.45 },
        { f: 783.99, t: 0.62, d: 0.15 },
        { f: 1046.5, t: 0.78, d: 0.6 }
      ];
      melody.forEach((n) => {
        const start = this.audioCtx.currentTime + n.t;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, start);
        gain.gain.setValueAtTime(0.26, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + n.d);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(start);
        osc.stop(start + n.d + 0.02);
      });
    } catch {}
  }

  speak() {
    // Text-to-speech dinonaktifkan sepenuhnya
    return;
  }

  stopSpeaking() {
    return;
  }
}

export const audioEngine = new AudioEngine();
