import { useEffect, useRef, useState } from 'react'

const FRAMES = [
  '/about-film/stage1.jpg',
  '/about-film/stage2.jpg',
  '/about-film/stage3.jpg',
  '/about-film/stage4.jpg',
]
const HOLD = 5000
const VOICE = '/about-film/voiceover.mp3'

export default function QuoteFilm() {
  const [i, setI] = useState(0)
  const [hasVo, setHasVo] = useState(false)
  const [on, setOn] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const probe = new Audio(VOICE)
    probe.addEventListener('canplaythrough', () => setHasVo(true), { once: true })
    probe.addEventListener('error', () => setHasVo(false), { once: true })
    probe.load()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const id = window.setInterval(() => setI((n) => (n + 1) % FRAMES.length), HOLD)
    return () => {
      window.clearInterval(id)
      probe.src = ''
    }
  }, [])

  const toggleVoice = () => {
    if (!hasVo) return
    if (!audio.current) {
      const el = new Audio(VOICE)
      el.loop = true
      audio.current = el
    }
    if (on) {
      audio.current.pause()
      setOn(false)
    } else {
      void audio.current.play().then(() => setOn(true)).catch(() => setOn(false))
    }
  }

  useEffect(() => () => { audio.current?.pause() }, [])

  return (
    <figure className="quote-film">
      <img src={FRAMES[i]} alt="Still from the quote film" width={1280} height={720} />
      {hasVo ? (
        <button type="button" className="quote-film-vo" onClick={toggleVoice} aria-pressed={on}>
          {on ? 'Voice off' : 'Voice on'}
        </button>
      ) : null}
    </figure>
  )
}
