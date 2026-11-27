/**
 * Optional, opt-in harmonic Web Audio synthesizer for the SONA Living Signal stage.
 * Always disabled by default; requires an explicit user toggle gesture to activate.
 */
const PENTATONIC_LYDIAN_HZ = [
  293.66, // D4
  329.63, // E4
  369.99, // F#4
  440.0,  // A4
  493.88, // B4
  587.33, // D5
  659.25, // E5
  739.99, // F#5
  880.0,  // A5
];

export class SignalAudioSynth {
  private ctx: AudioContext | null = null;
  private enabled = false;

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(next: boolean): boolean {
    this.enabled = next;
    if (next) {
      const ctx = this.ensureContext();
      if (ctx && ctx.state === 'suspended') {
        void ctx.resume();
      }
      this.playHarmonic(0.5, 0.35);
    }
    return this.enabled;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    return this.ctx;
  }

  public playHarmonic(normalizedY: number, intensity = 0.6): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return;

    const clampedY = Math.max(0, Math.min(1, 1 - normalizedY));
    const idx = Math.min(
      PENTATONIC_LYDIAN_HZ.length - 1,
      Math.floor(clampedY * PENTATONIC_LYDIAN_HZ.length),
    );
    const baseFreq = PENTATONIC_LYDIAN_HZ[idx];
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.065 * intensity, now + 0.018);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(620, now + 0.9);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(baseFreq * 2, now);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.18, now);

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.2);
    osc2.stop(now + 1.2);
  }

  public playPulseChord(): void {
    if (!this.enabled) return;
    this.playHarmonic(0.72, 0.48);
    window.setTimeout(() => this.playHarmonic(0.45, 0.36), 60);
    window.setTimeout(() => this.playHarmonic(0.22, 0.28), 125);
  }

  public dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
