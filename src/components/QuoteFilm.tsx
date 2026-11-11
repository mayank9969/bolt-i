import { useEffect, useRef, useState } from 'react'

const FRAMES = [
  '/about-film/stage1.jpg',
  '/about-film/stage2.jpg',
  '/about-film/stage3.jpg',
  '/about-film/stage4.jpg',
]
const HOLD = 5000
const VOICE = '/about-film/voiceover.mp3'

/** Ken-burns stills between the map quotes. Drop an mp3 at public/about-film/voiceover.mp3 */
export default function QuoteFilm() {
  const [i, setI] = useState(0)
  const [hasVo, setHasVo] = useState(false)
  const [on, setOn] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)
  const reduce = useRef(false)

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    fetch(VOICE, { method: 'HEAD' })
      .then((r) => setHasVo(r.ok))
      .catch(() => setHasVo(false))
  }, [])

  useEffect(() => {
    if (reduce.current) return
    const id = window.setInterval(() => setI((n) => (n + 1) % FRAMES.length), HOLD)
    return () => window.clearInterval(id)
  }, [])

  const toggleVoice = () => {
    if (!hasVo) return
    if (!audio.current) {
      const el = new Audio(VOICE)
      el.loop = true
      audio.current = el
    }
    const el = audio.current
    if (on) {
      el.pause()
      setOn(false)
    } else {
      void el.play().then(() => setOn(true)).catch(() => setOn(false))
    }
  }

  useEffect(() => () => { audio.current?.pause() }, [])

  return (
    <figure className="quote-film" aria-label="Four stills between the quotes">
      <div className="quote-film-stage">
        {FRAMES.map((src, n) => (
          <img key={src} src={src} alt="" className={n === i ? 'is-on' : ''} />
        ))}
      </div>
      {hasVo ? (
        <button type="button" className="quote-film-vo" onClick={toggleVoice} aria-pressed={on}>
          {on ? 'Voice off' : 'Voice on'}
        </button>
      ) : (
        <p className="quote-film-hint">To add your recording, put it at public/about-film/voiceover.mp3</p>
      )}
    </figure>
  )
}
