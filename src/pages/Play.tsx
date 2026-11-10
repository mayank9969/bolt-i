import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorld } from '@/components/three/world'
import { getTheme, onThemeChange, type ThemeId } from '@/lib/theme'
import { getHistory, startQuiz } from '@/api/quizApi'
import { reviewTopics } from '@/lib/review'
import { useQuiz } from '@/context/QuizContext'
import type { DifficultyChoice } from '@/types/quiz'

/**
 * Practice is the illustrated relay. Paper/Ink is bridged; story art is not recolored.
 * Collage Play buttons open the live quiz engine / studio pages via /api.
 */
export default function Play() {
  useWorld({ mode: 'quiet' })
  const ref = useRef<HTMLIFrameElement>(null)
  const navigate = useNavigate()
  const { beginSession } = useQuiz()
  const theme = getTheme()

  useEffect(() => {
    const send = (id: ThemeId) => {
      const win = ref.current?.contentWindow
      if (!win) return
      win.postMessage({ type: 'veyra-theme', theme: id }, '*')
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
    const launch = async (category: string, difficulty: DifficultyChoice, questionCount: number) => {
      try {
        const config = { category, difficulty, questionCount }
        const session = await startQuiz(config)
        beginSession(config, session)
        navigate('/quiz')
      } catch {
        navigate('/setup', { state: { category, difficulty, questionCount } })
      }
    }

    const onMsg = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return
      const d = e.data
      if (!d || d.type !== 'veyra-practice-action') return
      const go: Record<string, () => void> = {
        daily: () => {
          void launch('all', 'mixed', 5)
        },
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
              if (next) void launch(next.id, 'mixed', 5)
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
  }, [navigate, beginSession])

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
