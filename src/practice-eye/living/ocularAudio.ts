export class OcularAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private enabled = false;
  private lastSaccadeSoundTime = 0;

  public toggle(): boolean {
    if (!this.enabled) {
      this.start();
      return this.enabled;
    } else {
      this.stop();
      return false;
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private start() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.0001;

        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 380;
        this.filter.Q.value = 2.4;

        // Warm binaural harmonic pair
        this.osc1 = this.ctx.createOscillator();
        this.osc1.type = 'sine';
        this.osc1.frequency.value = 110.0;

        this.osc2 = this.ctx.createOscillator();
        this.osc2.type = 'triangle';
        this.osc2.frequency.value = 164.81; // E3 fifth

        const osc2Gain = this.ctx.createGain();
        osc2Gain.gain.value = 0.28;

        // Uncertainty LFO (delicate wavering doubt)
        this.lfo = this.ctx.createOscillator();
        this.lfo.type = 'sine';
        this.lfo.frequency.value = 3.4;

        this.lfoGain = this.ctx.createGain();
        this.lfoGain.gain.value = 0.6;

        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.osc1.frequency);
        this.lfoGain.connect(this.osc2.frequency);

        this.osc1.connect(this.filter);
        this.osc2.connect(osc2Gain);
        osc2Gain.connect(this.filter);

        this.filter.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.osc1.start();
        this.osc2.start();
        this.lfo.start();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      if (this.masterGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setTargetAtTime(0.085, now, 0.45);
      }

      this.enabled = true;
    } catch {
      this.enabled = false;
    }
  }

  private stop() {
    this.enabled = false;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.0001, now, 0.25);
    }
  }

  public update(pupilNormalized: number, curiosity: number, uncertainty: number, wonder: number) {
    if (!this.enabled || !this.ctx || !this.filter || !this.lfoGain || !this.osc2) return;

    const now = this.ctx.currentTime;
    // Filter opens wide with pupil dilation & wonder, narrows with uncertainty
    const targetCutoff = 210 + pupilNormalized * 720 + wonder * 340 - uncertainty * 90;
    this.filter.frequency.setTargetAtTime(Math.max(160, targetCutoff), now, 0.08);
    this.filter.Q.setTargetAtTime(1.8 + uncertainty * 3.8 + curiosity * 1.2, now, 0.1);

    // Uncertainty introduces subtle autonomic vibrato/hippus shimmer
    this.lfoGain.gain.setTargetAtTime(0.25 + uncertainty * 2.8, now, 0.12);
  }

  public playSaccadePulse(amplitude: number, curiosity: number, uncertainty: number) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    if (now - this.lastSaccadeSoundTime < 0.11) return;
    this.lastSaccadeSoundTime = now;

    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    // Curious saccades sound crystalline & upward; uncertain ones sound soft & questioning
    const notes = curiosity >= uncertainty
      ? [329.63, 392.0, 440.0, 523.25, 659.25]
      : [293.66, 311.13, 369.99, 415.30];
    const baseFreq = notes[Math.floor(Math.random() * notes.length)];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * (0.98 + amplitude * 0.12), now);
    osc.frequency.exponentialRampToValueAtTime(
      baseFreq * (curiosity >= uncertainty ? 1.03 : 0.96),
      now + 0.16
    );

    const peak = Math.min(0.032, 0.01 + amplitude * 0.035);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.014);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(env);
    env.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playRippleChime(intensity: number) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [440.0, 554.37, 659.25];
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.045);
      env.gain.setValueAtTime(0.0001, now + idx * 0.045);
      env.gain.linearRampToValueAtTime(0.018 * intensity, now + idx * 0.045 + 0.03);
      env.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.65);
      osc.connect(env);
      env.connect(this.ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.7);
    });
  }

  public dispose() {
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
