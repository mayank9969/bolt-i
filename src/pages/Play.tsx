import { useEffect, useRef } from 'react'
import { useWorld } from '@/components/three/world'
import { getTheme, onThemeChange, type ThemeId } from '@/lib/theme'
import PracticeDesk from '@/components/PracticeDesk'

/**
 * Practice = learning desk (real engine data) + the illustrated relay iframe.
 * Paper/Ink is bridged; story artwork is not recolored.
 */
export default function Play() {
  useWorld({ mode: 'quiet' })
  const ref = useRef<HTMLIFrameElement>(null)
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

  return (
    <div className="flex flex-col bg-canvas">
      <PracticeDesk />
      <iframe
        ref={ref}
        title="VEYRA Practice — relay of curiosity"
        src={`/practice-relay/index.html?eye=3&theme=${theme}`}
        className="w-full border-0 block bg-canvas overflow-auto"
        style={{ height: 'min(92dvh, 1100px)', minHeight: '28rem' }}
      />
    </div>
  )
}
