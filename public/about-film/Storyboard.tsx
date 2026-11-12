import { useEffect, useRef } from "react";
import { REFERENCES, VECTOR_AXES } from "../film/timeline";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function Storyboard() {
  const ref = useReveal();

  return (
    <div ref={ref}>
      {/* ---------------- the four movements ---------------- */}
      <section className="mx-auto mt-28 max-w-6xl px-6">
        <div className="reveal mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#179fe8]">
              inside his head
            </p>
            <h2 className="font-display text-4xl font-light leading-tight text-[#f3eefb] sm:text-5xl">
              Four movements of
              <br />
              <span className="italic text-[#e90096]">not being there.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#b9aed4]">
            The dream is one continuous experience — the same petal of light carries you from
            movement to movement. No cuts. Only drift, focus, and colour waking up.
          </p>
        </div>

        <div className="space-y-20">
          {REFERENCES.map((r, i) => (
            <article
              key={r.index}
              className={`reveal grid items-center gap-8 md:grid-cols-2 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              <div className="plate-hover film-frame relative overflow-hidden rounded-md">
                <img
                  src={r.image}
                  alt={r.title}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 font-display text-sm italic text-white backdrop-blur-sm">
                  {["I", "II", "III", "IV"][i]}
                </span>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#b9aed4]/70">
                  {r.subtitle}
                </p>
                <h3 className="font-display text-3xl font-light text-[#f3eefb]">{r.title}</h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-[#b9aed4]">{r.description}</p>
                <p className="mt-3 text-xs italic tracking-wide text-[#a982ff]">{r.motion}</p>

                {/* mood vector */}
                <div className="mt-6 max-w-md">
                  <div className="grid grid-cols-3 gap-x-5 gap-y-3 sm:grid-cols-6">
                    {r.vector.map((v, vi) => (
                      <div key={vi}>
                        <div className="mb-1 h-1 overflow-hidden rounded-full bg-[#b9aed4]/15">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${v * 100}%`,
                              background: `linear-gradient(90deg, ${r.palette[0]}, ${r.palette[3]})`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] uppercase tracking-wider text-[#b9aed4]/60">
                          {VECTOR_AXES[vi]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {r.palette.map((c) => (
                      <span
                        key={c}
                        className="h-4 w-4 rounded-full ring-1 ring-white/15"
                        style={{ background: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------- the idea ---------------- */}
      <section className="relative mx-auto mt-32 max-w-3xl px-6 text-center">
        <div className="reveal">
          <svg viewBox="0 0 24 24" className="mx-auto mb-6 h-8 w-8 fill-none stroke-[#e90096]" strokeWidth="1.2" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" strokeLinecap="round" />
          </svg>
          <h2 className="font-display text-3xl font-light leading-snug text-[#f3eefb] sm:text-4xl">
            The body sits on the bench.
            <br />
            <span className="italic text-[#b9aed4]">The mind is three summers away.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-[#b9aed4]">
            Everybody lives more in their mind than in the present — wanting elsewhere, rehearsing
            futures, replaying ghosts. The person beside us becomes a screen for everything we
            project, and the actual moment passes unwatched. The film takes forty seconds and
            leaves room to breathe, because the point isn't the dream — it's the bench you forgot
            you were sitting on.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#b9aed4]/80">
            Watch it twice. The first time for his dream. The second time for the ending — when you
            notice the strangers on the path, and the small bloom above her head. She wasn't fully
            here either. Nobody ever is. That's the film.
          </p>
        </div>
      </section>

      {/* ---------------- voice note ---------------- */}
      <section className="mx-auto mt-24 max-w-4xl px-6">
        <div className="reveal rounded-lg border border-[#b9aed4]/12 bg-[#140d24]/60 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-none stroke-[#179fe8]" strokeWidth="1.5" aria-hidden>
              <path d="M12 3v18M8 8v8M4 10v4M16 6v12M20 9v6" strokeLinecap="round" />
            </svg>
            <div>
              <h3 className="font-display text-xl font-light text-[#f3eefb]">About the voice</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#b9aed4]">
                The narration is arranged as eight separate scene cues, with a breath between
                each thought. Every line appears just before it is spoken, and stays with the
                picture when you pause, replay, or seek.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-24 border-t border-[#b9aed4]/10 py-10 text-center">
        <p className="font-display text-sm italic text-[#b9aed4]/70">
          Somewhere Else — a micro-film about being absent, on purpose, beautifully.
        </p>
      </footer>
    </div>
  );
}
