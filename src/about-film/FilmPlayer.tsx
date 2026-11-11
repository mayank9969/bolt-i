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
  const [narration, setNarration] = useState<"captions" | "voice">("captions");
  const [caption, setCaption] = useState<{ text: string; id: number } | null>(null);
  const [quoteOn, setQuoteOn] = useState(false);

  const tRef = useRef(0);
  const idleRef = useRef(0);
  const playingRef = useRef(false);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const audioRef = useRef<FilmAudio | null>(null);

  /* ---------------------------------------------------------- setup */
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new FilmAudio();
      void audioRef.current.probeVoiceover().then(() => setReady(true));
    } else {
      setReady(true);
    }
    return () => {
      cancelAnimationFrame(rafRef.current);
      audioRef.current?.stop();
    };
  }, []);

  /* ---------------------------------------------------------- resize */
  useEffect(() => {
    const fit = () => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
        const fromVo = audioRef.current?.mediaTime();
        if (fromVo != null) tRef.current = Math.min(DURATION, fromVo);
        else tRef.current = Math.min(DURATION, tRef.current + dt * FilmAudio.VO_RATE);
        syncUi(tRef.current);
        if (tRef.current >= DURATION - 0.05) {
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
      if ((prev?.id ?? -1) === id) return prev;
      return active ? { text: active.text, id } : null;
    });
    setQuoteOn((prev) => {
      const next = t >= QUOTE.appearsAt;
      return prev === next ? prev : next;
    });
  };

  /* ---------------------------------------------------------- transport */
  const play = useCallback((fromStart: boolean) => {
    if (audioRef.current) audioRef.current.tts = narration === "voice";
    if (fromStart || tRef.current >= DURATION || tRef.current < 0.05) {
      tRef.current = 0;
      setQuoteOn(false);
      setCaption(null);
      audioRef.current?.stop();
      audioRef.current?.start();
    } else {
      audioRef.current?.resume();
    }
    setEnded(false);
    playingRef.current = true;
    setPlaying(true);
  }, [narration]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    audioRef.current?.pause();
  }, []);

  const toggle = () => (playingRef.current ? pause() : play(false));

  const onScrub = (v: number) => {
    tRef.current = v;
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
        {caption && !ended && (
          <div key={caption.id} className="caption pointer-events-none absolute inset-x-0 bottom-[9%] flex justify-center px-6">
            <p className="max-w-2xl text-center text-[clamp(0.85rem,2.2vw,1.2rem)] font-light tracking-wide text-[#f3eefb]/95">
              {caption.text}
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
      <div className="mt-4 rounded-lg border border-[#b9aed4]/12 bg-[#140d24]/70 px-4 py-3 backdrop-blur-sm">
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

          <span ref={timeLabelRef} className="w-12 shrink-0 text-right font-mono text-xs text-[#b9aed4]">0.0s</span>

          <button
            onClick={toggleMute}
            className="btn-ghost flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#b9aed4]/20 text-[#b9aed4] hover:border-[#e90096] hover:text-[#e90096]"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
            )}
          </button>

          <button
            onClick={() => setNarration(narration === "captions" ? "voice" : "captions")}
            className={`btn-ghost hidden shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider sm:block ${
              narration === "voice"
                ? "border-[#e90096] text-[#e90096]"
                : "border-[#b9aed4]/20 text-[#b9aed4] hover:border-[#b9aed4]/50"
            }`}
            title="Device narration is a synthetic stand-in. Drop a real recording at /public/voiceover.mp3 and the film will use it automatically."
          >
            {narration === "voice" ? "voice: device" : "voice: captions"}
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
              <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-[#b9aed4]/40 transition group-hover:scale-150 group-hover:bg-[#e90096]" />
              <span className="mt-1 block text-[9px] uppercase tracking-[0.18em] text-[#b9aed4]/60 transition group-hover:text-[#f3eefb]">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
