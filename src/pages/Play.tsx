import { useEffect, useRef } from 'react'
import { useWorld } from '@/components/three/world'
import { getTheme, onThemeChange, type ThemeId } from '@/lib/theme'

/**
 * Practice is the VEYRA relay site in an iframe.
 * Paper/Ink is bridged from the parent; story artwork is not recolored.
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
    <iframe
      ref={ref}
      title="VEYRA Practice"
      src={`/practice-relay/index.html?eye=3&theme=${theme}`}
      className="w-full border-0 block bg-canvas overflow-auto"
      style={{ height: 'calc(100dvh - var(--veyra-header, 5.25rem))', minHeight: 0 }}
    />
  )
}
