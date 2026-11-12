import { useCallback, useEffect, useRef, useState } from "react";
import { CAPTIONS, DURATION, QUOTE, STAGES } from "./timeline";
import { FilmAudio } from "./audio";
import { drawFilmScene } from "./scene";

export default function FilmPlayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const timeLabelRef = useRef<HTMLSpanElement>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [caption, setCaption] = useState<{ text: string; words: string[]; id: number } | null>(null);
  const [quoteOn, setQuoteOn] = useState(false);

  const tRef = useRef(0);
  const idleRef = useRef(0);
  const playingRef = useRef(false);
  const audioStartedRef = useRef(false);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const audioRef = useRef<FilmAudio | null>(null);

  /* ---------------------------------------------------------- setup */
  useEffect(() => {
    const audio = audioRef.current ?? new FilmAudio();
    audioRef.current = audio;
    let mounted = true;
    audio.probeVoiceover().then((available) => {
      if (!mounted) return;
      setVoiceAvailable(available);
      setReady(true);
    });
    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      audio.stop();
    };
  }, []);

  /* ---------------------------------------------------------- resize */
  useEffect(() => {
    const fit = () => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const w = Math.round(c.clientWidth * dpr);
      const h = Math.round(c.clientHeight * dpr);
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [ready]);

  /* ---------------------------------------------------------- loop */
  useEffect(() => {
    if (!ready) return;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;
      idleRef.current += dt;

      if (playingRef.current) {
        const voiceTime = audioRef.current?.voiceTime;
        tRef.current =
          voiceTime == null
            ? Math.min(DURATION, tRef.current + dt)
            : Math.min(DURATION, voiceTime);
        syncUi(tRef.current);
        if (tRef.current >= DURATION) {
          playingRef.current = false;
          setPlaying(false);
          setEnded(true);
          audioRef.current?.stop();
        }
      }

      const c = canvasRef.current;
      const ctx = c?.getContext("2d", { alpha: false, desynchronized: true });
      if (c && ctx && c.width > 0) {
        drawFilmScene(ctx, c.width, c.height, tRef.current, idleRef.current);
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const syncUi = (t: number) => {
    if (rangeRef.current) {
      rangeRef.current.value = String(t);
      rangeRef.current.style.setProperty("--fill", `${(t / DURATION) * 100}%`);
    }
    if (timeLabelRef.current) {
      timeLabelRef.current.textContent = `${t.toFixed(1)}s`;
    }
    const active = CAPTIONS.find((c) => t >= c.at && t <= c.until);
    setCaption((prev) => {
      const id = active ? CAPTIONS.indexOf(active) : -1;
      if (!active) return null;
      const progress = Math.max(0, Math.min(1, (t - active.at) / (active.until - active.at)));
      const words = revealWords(active.text, progress);
      if (prev?.id === id && prev.words.length === words.length) return prev;
      return { text: active.text, words, id };
    });
    setQuoteOn((prev) => {
      const next = t >= QUOTE.appearsAt;
      return prev === next ? prev : next;
    });
  };

  /* ---------------------------------------------------------- transport */
  const play = useCallback((fromStart: boolean) => {
    const audio = audioRef.current;
    if (fromStart || tRef.current >= DURATION || tRef.current < 0.05) {
      tRef.current = 0;
      setQuoteOn(false);
      setCaption(null);
      audio?.start(true);
      audioStartedRef.current = true;
    } else if (!audioStartedRef.current) {
      audio?.start(false);
      audioStartedRef.current = true;
    } else {
      audio?.resume();
    }
    setEnded(false);
    playingRef.current = true;
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    audioRef.current?.pause();
  }, []);

  const toggle = () => (playingRef.current ? pause() : play(false));

  const onScrub = (v: number) => {
    tRef.current = v;
    audioRef.current?.seekVoice(v);
    if (v < DURATION && ended) setEnded(false);
    syncUi(v);
  };

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    audioRef.current?.setMuted(m);
  };

  const showQuote = quoteOn || ended;

  /* ---------------------------------------------------------- ui */
  return (
    <div className="w-full">
      <div className="film-frame relative overflow-hidden rounded-lg bg-black aspect-video select-none">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        {/* letterbox bars */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[4%] bg-black/90" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[4%] bg-black/90" />

        {/* captions */}
        {captionsOn && caption && !ended && (
          <div key={caption.id} className="caption pointer-events-none absolute inset-x-0 bottom-[9%] flex justify-center px-6">
            <p aria-label={caption.text} className="max-w-2xl text-center text-[clamp(0.85rem,2.2vw,1.2rem)] font-light tracking-wide text-[#f3eefb]/95">
              {caption.words.map((word, index) => (
                <span key={`${caption.id}-${index}`} aria-hidden="true" className="caption-word">
                  {word}
                </span>
              ))}
            </p>
          </div>
        )}

        {/* quote card */}
        {showQuote && (
          <div className="quote-card pointer-events-none absolute inset-x-0 bottom-[6%] flex flex-col items-center justify-end pb-[7%] px-6 text-center">
            <div className="rounded-md bg-[#0b0714]/70 px-8 py-5 backdrop-blur-sm ring-1 ring-[#b9aed4]/15">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.4em] text-[#e90096]">
                the point, if there is one
              </span>
              <p className="font-display text-[clamp(1rem,2.6vw,1.7rem)] font-light italic leading-snug text-[#f3eefb]">
                {QUOTE.line1} {QUOTE.line2}
                <br />
                <span className="text-[#a982ff]">{QUOTE.line3}</span>
              </p>
              <p className="mt-3 text-[clamp(0.7rem,1.6vw,0.9rem)] font-medium not-italic tracking-wide text-[#ff9a00]">
                {QUOTE.kicker}
              </p>
            </div>
          </div>
        )}

        {/* big play / replay */}
        {ready && !playing && (
          <button
            onClick={() => play(ended || tRef.current === 0)}
            className="btn-ghost group absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#f3eefb]/25 bg-[#0b0714]/50 backdrop-blur-sm hover:border-[#e90096] hover:bg-[#e90096]/20"
            aria-label={ended ? "Replay the film" : "Play the film"}
          >
            <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 fill-[#f3eefb] transition-transform group-hover:scale-110" aria-hidden>
              {ended ? (
                <path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />
              ) : (
                <path d="M8 5v14l11-7z" />
              )}
            </svg>
          </button>
        )}
      </div>

      {/* transport bar */}
      <div className="film-transport mt-4 rounded-2xl border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            disabled={!ready}
            className="btn-ghost flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3eefb] text-[#0b0714] hover:bg-[#e90096] hover:text-white disabled:opacity-40"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-current"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <input
            ref={rangeRef}
            type="range"
            className="scrub w-full"
            min={0}
            max={DURATION}
            step={0.01}
            defaultValue={0}
            disabled={!ready}
            onChange={(e) => onScrub(parseFloat(e.target.value))}
            aria-label="Film timeline"
          />

          <span ref={timeLabelRef} className="film-time w-12 shrink-0 text-right font-mono text-xs">0.0s</span>

          <button
            onClick={toggleMute}
            className="film-mute film-voice btn-ghost hidden shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider sm:block"
            aria-label={muted ? "Sound on" : "Sound off"}
            aria-pressed={!muted}
          >
            {muted ? "Sound on" : "Sound off"}
          </button>

          <button
            onClick={() => setCaptionsOn((v) => !v)}
            className={`film-voice btn-ghost hidden shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider sm:block ${
              captionsOn ? "is-on" : ""
            }`}
            aria-pressed={captionsOn}
            title={voiceAvailable ? "Captions follow the recorded take." : "Voiceover file not found. Captions still follow the timeline."}
          >
            {captionsOn ? "captions on" : "captions off"}
          </button>
        </div>

        {/* stage markers */}
        <div className="relative mt-2 h-5">
          {STAGES.map((s, i) => (
            <button
              key={i}
              onClick={() => onScrub(s.mark)}
              className="group absolute -translate-x-1/2"
              style={{ left: `${(s.mark / DURATION) * 100}%` }}
              title={`Jump to “${s.label}”`}
            >
              <span className="film-mark mx-auto block h-1.5 w-1.5 rounded-full transition group-hover:scale-150" />
              <span className="film-mark-label mt-1 block text-[9px] uppercase tracking-[0.18em] transition">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function revealWords(text: string, progress: number): string[] {
  const parts = text.match(/\S+/g) ?? [];
  const words: string[] = [];

  parts.forEach((part) => {
    if (/^[—–]+$/.test(part) && words.length) words[words.length - 1] += ` ${part}`;
    else words.push(part);
  });

  const weights = words.map((word) => {
    const letters = word.replace(/[^\p{L}\p{N}']/gu, "").toLowerCase();
    const syllables = (letters.match(/[aeiouy]+/g) ?? []).length;
    const punctuation = /[.!?…]$/.test(word) ? 0.8 : /[,;:]$/.test(word) ? 0.45 : /[—–]$/.test(word) ? 0.65 : 0;
    return Math.max(1, syllables) + punctuation;
  });

  const threshold = progress * weights.reduce((sum, weight) => sum + weight, 0);
  let elapsed = 0;
  const count = weights.reduce((visible, weight, index) => {
    const shouldShow = index === 0 || elapsed <= threshold;
    elapsed += weight;
    return visible + Number(shouldShow);
  }, 0);

  return words.slice(0, Math.max(1, count));
}
