// Lightweight Web Audio synthesizer for mechanical typewriter keystrokes
// 100% native Web Audio API, zero external audio assets, zero network fetch.

class TypewriterAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;

  constructor() {
    const saved = localStorage.getItem('novelforge_typewriter_sound');
    this.isMuted = saved === null ? true : saved !== 'true';
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('novelforge_typewriter_sound', String(!muted));
    if (!muted) {
      this.initContext();
      // Play a tiny confirmation click
      this.playKeyClick(false);
    }
  }

  public playKeyClick(isNewline: boolean = false) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Transient click (filtered noise burst)
      const bufferSize = Math.floor(this.ctx.sampleRate * (isNewline ? 0.035 : 0.018));
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      // Filter: warm wood/keycap resonance
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isNewline ? 650 : 1200 + (Math.random() * 300 - 150), now);
      filter.Q.setValueAtTime(2.5, now);

      // Volume envelope: ultra-gentle, non-intrusive
      const gainNode = this.ctx.createGain();
      const peakVol = isNewline ? 0.045 : 0.028;
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(peakVol, now + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + (isNewline ? 0.035 : 0.018));

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      whiteNoise.onended = () => {
        try {
          whiteNoise.disconnect();
          filter.disconnect();
          gainNode.disconnect();
        } catch {
          // Ignore disconnection errors on already destroyed context
        }
      };

      whiteNoise.start(now);
      whiteNoise.stop(now + (isNewline ? 0.04 : 0.02));
    } catch {
      // AudioContext not allowed or disabled, fail silently
    }
  }
}

export const typewriterAudio = new TypewriterAudioEngine();
