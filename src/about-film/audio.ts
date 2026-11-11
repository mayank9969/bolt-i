import { CAPTIONS, DURATION, voiceClips, type VoiceClip } from "./timeline";

/**
 * FilmAudio
 * - Always: a hand-composed ambient score synthesised live with WebAudio —
 *   soft detuned pads (Am – F – C – G), a sub drone, transition whooshes,
 *   a tension layer and shimmer at the overwhelm peak, resolving bells at
 *   the end. Real audio, generated in the moment, paced to the 40s film.
 * - If a real human recording is dropped at /about-film/voiceover.mp3, it is detected
 *   and played in sync instead of captions-only.
 * - Optional device narration (speech synthesis) as an accessible stand-in.
 */
export class FilmAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private live: AudioNode[] = [];
  private timers: number[] = [];
  private vo: HTMLAudioElement | null = null;
  private hasVoiceover = false;
  private clips: VoiceClip[] = [];
  private clipI = -1;
  muted = false;
  tts = false;

  async probeVoiceover() {
    try {
      const el = new Audio("/about-film/voiceover.mp3");
      el.preload = "auto";
      await new Promise<void>((resolve, reject) => {
        el.addEventListener("loadedmetadata", () => resolve(), { once: true });
        el.addEventListener("error", () => reject(), { once: true });
        el.load();
      });
      const dur = el.duration;
      if (!dur || !isFinite(dur) || dur < 1) {
        this.hasVoiceover = false;
        return false;
      }
      this.vo = el;
      this.clips = voiceClips(dur);
      this.hasVoiceover = true;
    } catch {
      this.hasVoiceover = false;
    }
    return this.hasVoiceover;
  }

  /** Play the take that belongs on this frame of the picture. */
  sync(t: number) {
    if (!this.vo || !this.hasVoiceover || this.muted) return;
    const i = this.clips.findIndex((c) => t >= c.at && t < c.until);
    if (i < 0) {
      this.clipI = -1;
      this.vo.pause();
      return;
    }
    const c = this.clips[i];
    const window = Math.max(0.2, c.until - c.at);
    const srcDur = Math.max(0.2, c.srcEnd - c.srcStart);
    if (this.clipI !== i) {
      this.clipI = i;
      this.vo.playbackRate = Math.min(1.15, Math.max(0.78, srcDur / window));
      this.vo.preservesPitch = true;
      this.vo.currentTime = c.srcStart;
      this.vo.volume = this.muted ? 0 : 1;
      void this.vo.play().catch(() => {});
    } else if (this.vo.currentTime >= c.srcEnd - 0.04) {
      this.vo.pause();
    }
  }

  private ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  start() {
    const ctx = this.ensure();
    this.stopNodes();
    const t0 = ctx.currentTime + 0.05;
    const END = DURATION + 0.5;

    /* --- sub drone across the whole film --- */
    const drone = ctx.createOscillator();
    drone.type = "sine";
    drone.frequency.value = 55;
    const droneG = ctx.createGain();
    droneG.gain.setValueAtTime(0, t0);
    droneG.gain.linearRampToValueAtTime(0.09, t0 + 2.0);
    droneG.gain.setValueAtTime(0.09, t0 + DURATION - 3);
    droneG.gain.linearRampToValueAtTime(0, t0 + END);
    const droneF = ctx.createBiquadFilter();
    droneF.type = "lowpass";
    droneF.frequency.value = 140;
    drone.connect(droneF).connect(droneG).connect(this.master!);
    drone.start(t0);
    drone.stop(t0 + END);
    this.live.push(drone);

    /* --- pad chords: Am F C G, 2.5s each, across 40s --- */
    const chords = [
      [110.0, 164.81, 220.0],
      [87.31, 130.81, 174.61],
      [130.81, 196.0, 261.63],
      [98.0, 146.83, 196.0],
    ];
    const padBus = ctx.createGain();
    padBus.gain.value = 0.15;
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.setValueAtTime(480, t0);
    padFilter.frequency.linearRampToValueAtTime(900, t0 + 10);
    padFilter.frequency.linearRampToValueAtTime(1600, t0 + 27);
    padFilter.frequency.linearRampToValueAtTime(380, t0 + 34);
    padFilter.frequency.linearRampToValueAtTime(520, t0 + DURATION);
    padBus.connect(padFilter).connect(this.master!);

    const steps = Math.ceil(DURATION / 2.5);
    for (let i = 0; i < steps; i++) {
      const notes = chords[i % 4];
      const start = t0 + i * 2.5;
      const dur = 2.9;
      notes.forEach((f, n) => {
        const o = ctx.createOscillator();
        o.type = n === 2 ? "sine" : "triangle";
        o.frequency.value = f;
        o.detune.value = (n - 1) * 6 + Math.random() * 4;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.5 / (n + 1), start + 0.7);
        g.gain.setValueAtTime(0.5 / (n + 1), start + dur - 1.0);
        g.gain.linearRampToValueAtTime(0, start + dur);
        o.connect(g).connect(padBus);
        o.start(start);
        o.stop(start + dur + 0.05);
        this.live.push(o);
      });
    }

    /* --- transition whooshes at each dream threshold --- */
    [8.1, 15.5, 20.9, 26.0, 30.6].forEach((at) => this.whoosh(t0 + at));

    /* --- tension layer for the overwhelm (≈26–30s) --- */
    [110.0, 116.54].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0 + 26);
      g.gain.linearRampToValueAtTime(0.028, t0 + 27.5);
      g.gain.setValueAtTime(0.028, t0 + 29);
      g.gain.linearRampToValueAtTime(0, t0 + 30.5);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 420 + i * 180;
      bp.Q.value = 2;
      o.connect(bp).connect(g).connect(this.master!);
      o.start(t0 + 26);
      o.stop(t0 + 30.6);
      this.live.push(o);
    });

    /* --- shimmer at the peak --- */
    const shim = ctx.createOscillator();
    shim.type = "sine";
    shim.frequency.setValueAtTime(1567.98, t0 + 27.2);
    shim.frequency.exponentialRampToValueAtTime(2093.0, t0 + 28.6);
    const shimG = ctx.createGain();
    shimG.gain.setValueAtTime(0, t0 + 27.2);
    shimG.gain.linearRampToValueAtTime(0.045, t0 + 27.6);
    shimG.gain.exponentialRampToValueAtTime(0.0001, t0 + 30.2);
    shim.connect(shimG).connect(this.master!);
    shim.start(t0 + 27.2);
    shim.stop(t0 + 30.3);
    this.live.push(shim);

    /* --- resolving bells as reality returns --- */
    const bell = (at: number, f: number, vol = 0.05) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0 + at);
      g.gain.linearRampToValueAtTime(vol, t0 + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 3.2);
      o.connect(g).connect(this.master!);
      o.start(t0 + at);
      o.stop(t0 + at + 3.3);
      this.live.push(o);
    };
    bell(31.0, 880.0);
    bell(35.6, 659.25, 0.045);
    bell(39.0, 440.0, 0.04);

    this.clipI = -1;

    /* --- optional device narration stand-in --- */
    if (this.tts && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const voice = this.pickVoice();
      CAPTIONS.forEach((c) => {
        const id = window.setTimeout(() => {
          const u = new SpeechSynthesisUtterance(c.text);
          if (voice) u.voice = voice;
          u.rate = 0.92;
          u.pitch = 1.08;
          u.volume = this.muted ? 0 : 1;
          window.speechSynthesis.speak(u);
        }, Math.max(0, (c.at - 0.05) * 1000));
        this.timers.push(id);
      });
    }
  }

  private whoosh(at: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * 0.8);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(280, at);
    bp.frequency.exponentialRampToValueAtTime(2400, at + 0.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(0.11, at + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.75);
    src.connect(bp).connect(g).connect(this.master!);
    src.start(at);
    this.live.push(src);
  }

  private pickVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const pref = voices.find((v) =>
      /female|samantha|zira|karen|moira|tessa|google uk english female|google us english/i.test(v.name)
    );
    return pref || voices.find((v) => v.lang.startsWith("en")) || voices[0];
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
    }
    if (this.vo) this.vo.volume = m ? 0 : 1;
  }

  pause() {
    this.ctx?.suspend();
    this.vo?.pause();
    this.clipI = -1;
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    this.clipI = -1;
  }

  private stopNodes() {
    this.live.forEach((n) => {
      try {
        (n as OscillatorNode).stop?.();
      } catch {
        /* already stopped */
      }
      try {
        n.disconnect();
      } catch {
        /* noop */
      }
    });
    this.live = [];
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
    if (this.vo) {
      this.vo.pause();
      this.vo.currentTime = 0;
    }
    this.clipI = -1;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  stop() {
    this.stopNodes();
  }
}
