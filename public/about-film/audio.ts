import { DURATION, VOICE_PARTS } from "./timeline";

const VOICE_RATE = 0.96;

/**
 * FilmAudio
 * - Always: a hand-composed ambient score synthesised live with WebAudio —
 *   soft detuned pads (Am – F – C – G), a sub drone, transition whooshes,
 *   a tension layer and shimmer at the overwhelm peak, resolving bells at
 *   the end. Real audio, generated in the moment, paced to the 40s film.
 * - The supplied recording is split into eight scene cues. Each cue is loaded
 *   and scheduled separately; the voice clock keeps captions and picture locked
 *   together during playback, pause, and seeking.
 */
export class FilmAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private live: AudioNode[] = [];
  private voiceNodes: AudioBufferSourceNode[] = [];
  private voiceBuffers: AudioBuffer[] = [];
  private hasVoiceover = false;
  private voicePosition = 0;
  private voiceClockOrigin = 0;
  private voiceRunning = false;
  muted = false;

  get voiceTime(): number | null {
    if (!this.hasVoiceover || !this.ctx) return null;
    if (!this.voiceRunning || this.ctx.state !== "running") return this.voicePosition;
    return Math.max(0, Math.min(DURATION, (this.ctx.currentTime - this.voiceClockOrigin) * VOICE_RATE));
  }

  async probeVoiceover() {
    try {
      const ctx = this.getContext();
      this.voiceBuffers = await Promise.all(
        VOICE_PARTS.map(async (part) => {
          const response = await fetch(part.src);
          if (!response.ok) throw new Error(`Could not load ${part.src}`);
          return ctx.decodeAudioData(await response.arrayBuffer());
        })
      );
      this.hasVoiceover = this.voiceBuffers.length === VOICE_PARTS.length;
    } catch {
      this.hasVoiceover = false;
      this.voiceBuffers = [];
    }
    return this.hasVoiceover;
  }

  private getContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.value = this.muted ? 0 : 1;
      this.voiceGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private ensure() {
    const ctx = this.getContext();
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return ctx;
  }

  start(resetVoice = true) {
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

    /* --- scene-by-scene narration, with a small breath between each part --- */
    if (this.hasVoiceover) {
      if (resetVoice) this.voicePosition = 0;
      this.voiceRunning = true;
      this.scheduleVoiceParts(this.voicePosition, t0);
    }
  }

  seekVoice(time: number) {
    if (!this.hasVoiceover || !this.ctx) return;
    this.voicePosition = Math.max(0, Math.min(DURATION, time));
    if (this.voiceRunning && this.ctx.state === "running") {
      this.scheduleVoiceParts(this.voicePosition, this.ctx.currentTime);
    }
  }

  private scheduleVoiceParts(fromTime: number, contextOrigin: number) {
    const ctx = this.ctx;
    if (!ctx || !this.voiceGain) return;
    this.stopVoiceNodes();
    this.voiceClockOrigin = contextOrigin - fromTime / VOICE_RATE;

    VOICE_PARTS.forEach((part, index) => {
      const buffer = this.voiceBuffers[index];
      if (!buffer) return;
      const endAt = part.at + buffer.duration;
      if (endAt <= fromTime) return;

      const elapsed = Math.max(0, fromTime - part.at);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = VOICE_RATE;
      source.connect(this.voiceGain!);
      const when = contextOrigin + Math.max(0, part.at - fromTime) / VOICE_RATE;
      source.start(when, elapsed);
      this.voiceNodes.push(source);
      this.live.push(source);
    });
  }

  private stopVoiceNodes() {
    const voices = new Set(this.voiceNodes);
    this.voiceNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
      try {
        node.disconnect();
      } catch {
        /* noop */
      }
    });
    this.voiceNodes = [];
    this.live = this.live.filter((node) => !voices.has(node as AudioBufferSourceNode));
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

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
    }
    if (this.voiceGain && this.ctx) {
      this.voiceGain.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05);
    }
  }

  pause() {
    const time = this.voiceTime;
    if (time != null) this.voicePosition = time;
    this.voiceRunning = false;
    this.stopVoiceNodes();
    void this.ctx?.suspend().catch(() => {});
  }

  resume() {
    const ctx = this.ctx;
    if (!ctx) return;
    const resumeVoice = () => {
      if (!this.hasVoiceover || this.voiceRunning) return;
      this.voiceRunning = true;
      this.scheduleVoiceParts(this.voicePosition, ctx.currentTime);
    };
    if (ctx.state === "suspended") {
      void ctx.resume().then(resumeVoice).catch(() => {});
    } else {
      resumeVoice();
    }
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
    this.voiceNodes = [];
    this.voiceRunning = false;
  }

  stop() {
    const time = this.voiceTime;
    if (time != null) this.voicePosition = time;
    this.stopNodes();
  }
}
