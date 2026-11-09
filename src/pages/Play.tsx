import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorld } from '@/components/three/world'
import { getTheme, onThemeChange, type ThemeId } from '@/lib/theme'
import { getHistory } from '@/api/quizApi'
import { reviewTopics } from '@/lib/review'

/**
 * Practice is the illustrated relay. Paper/Ink is bridged; story art is not recolored.
 * Daily / missed controls inside the iframe open the live quiz engine via Setup.
 */
export default function Play() {
  useWorld({ mode: 'quiet' })
  const ref = useRef<HTMLIFrameElement>(null)
  const navigate = useNavigate()
  const theme = getTheme()

  useEffect(() => {
    const send = (id: ThemeId) => {
      const win = ref.current?.contentWindow
      if (!win) return
      win.postMessage({ type: 'veyra-theme', theme: id }, window.location.origin)
    }
    const onLoad = () => send(getTheme())
    const el = ref.current
    el?.addEventListener('load', onLoad)
    send(getTheme())
    const off = onThemeChange(send)
    return () => {
      el?.removeEventListener('load', onLoad)
      off()
    }
  }, [])

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (e.source !== ref.current?.contentWindow) return
      const d = e.data
      if (!d || d.type !== 'veyra-practice-action') return
      const go: Record<string, () => void> = {
        daily: () =>
          navigate('/setup', { state: { category: 'all', difficulty: 'mixed', questionCount: 5, daily: true } }),
        focus: () => navigate('/setup'),
        concepts: () => navigate('/concepts'),
        take: () => navigate('/take'),
        lab: () => navigate('/lab'),
        history: () => navigate('/history'),
        progress: () => navigate('/progress'),
        missed: () => {
          getHistory()
            .then((h) => {
              const next = reviewTopics(h)[0]
              if (next) navigate('/setup', { state: { category: next.id, questionCount: 5 } })
              else navigate('/history')
            })
            .catch(() => navigate('/history'))
        },
      }
      const run = go[d.action as string]
      if (run) run()
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [navigate])

  return (
    <div className="bg-canvas">
      <iframe
        ref={ref}
        title="VEYRA Practice — relay of curiosity"
        src={`/practice-relay/index.html?eye=3&theme=${theme}`}
        className="w-full border-0 block bg-canvas overflow-auto"
        style={{ height: 'min(96dvh, 1400px)', minHeight: '32rem' }}
      />
    </div>
  )
}
