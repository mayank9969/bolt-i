import { Suspense, lazy, useEffect, useState } from 'react'

const Scene3D = lazy(() => import('./Scene3D'))

interface SceneLayerProps {
  variant?: 'hero' | 'ambient'
  className?: string
  opacity?: number
}

/**
 * Wraps the WebGL scene with lazy loading, reduced intensity on small
 * screens and a graceful no-op when the user prefers reduced motion.
 */
export default function SceneLayer({ variant = 'hero', className = '', opacity = 1 }: SceneLayerProps) {
  const [mode, setMode] = useState<'full' | 'lite' | 'off'>('full')

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const small = window.matchMedia('(max-width: 768px)').matches
    setMode(reduce ? 'off' : small ? 'lite' : 'full')
  }, [])

  if (mode === 'off') return null

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} style={{ opacity }} aria-hidden="true">
      <Suspense fallback={null}>
        <Scene3D variant={variant} lite={mode === 'lite'} />
      </Suspense>
    </div>
  )
}
