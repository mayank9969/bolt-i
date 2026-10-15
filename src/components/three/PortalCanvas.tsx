import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { onThemeChange, readToken, tokenHex } from '@/lib/theme'
import { fieldGuide } from '@/lib/fieldGuide'
import { exhibitFor } from '@/lib/exhibits'
import { getWorld } from './world'
type ControlsHandle = { reset: () => void }

type Note = { title: string; text: string; source?: string }

function palette() {
  const canvas = new THREE.Color(tokenHex('--nx-canvas-rgb'))
  const dark = canvas.getHSL({ h: 0, s: 0, l: 0 }).l < 0.5
  return {
    canvas,
    ink: new THREE.Color(tokenHex('--nx-text-rgb')),
    accent: new THREE.Color(tokenHex('--nx-accent-rgb')),
    warm: new THREE.Color(tokenHex('--nx-warm-rgb')),
    land: new THREE.Color(readToken('--nx-3d-land-2') || '#2e2e2e'),
    rock: new THREE.Color(readToken('--nx-3d-rock') || '#1a1a1a'),
    key: readToken('--nx-3d-key') || '#fff6e8',
    sky: readToken('--nx-3d-sky') || '#f3efe6',
    dark,
  }
}

function Hot({
  children,
  note,
  onNote,
}: {
  children: React.ReactNode
  note: Note
  onNote: (n: Note) => void
}) {
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        e.stopPropagation()
        onNote(note)
      }}
    >
      {children}
    </group>
  )
}

function MathsRoom({ onNote }: { onNote: (n: Note) => void }) {
  const ex = exhibitFor('maths')
  const g = fieldGuide('maths')
  const beat = (i: 0 | 1 | 2): Note => {
    const b = ex?.beats[i]
    return b
      ? { title: b.title, text: b.text, source: ex?.sources[0]?.url }
      : { title: g?.fact.title ?? 'Mathematics', text: g?.fact.text ?? '' }
  }
  return (
    <group>
      <Hot note={beat(0)} onNote={onNote}>
        <mesh position={[-1.6, 0.9, 0]}>
          <torusGeometry args={[0.55, 0.12, 16, 48]} />
          <meshStandardMaterial color="#16827e" roughness={0.4} />
        </mesh>
      </Hot>
      <Hot note={beat(1)} onNote={onNote}>
        <mesh position={[0, 1.1, 0.2]}>
          <icosahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color="#1b2230" roughness={0.35} />
        </mesh>
      </Hot>
      <Hot note={beat(2)} onNote={onNote}>
        <mesh position={[1.6, 0.85, -0.1]} rotation={[0.3, 0.4, 0]}>
          <octahedronGeometry args={[0.62, 0]} />
          <meshStandardMaterial color="#c4a882" roughness={0.45} />
        </mesh>
      </Hot>
    </group>
  )
}

function PythonRoom({ onNote }: { onNote: (n: Note) => void }) {
  const ex = exhibitFor('python')
  const beat = (i: 0 | 1 | 2): Note => {
    const b = ex?.beats[i]
    return { title: b?.title ?? 'Python', text: b?.text ?? '', source: ex?.sources[0]?.url }
  }
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <Hot key={i} note={beat(i as 0 | 1 | 2)} onNote={onNote}>
          <mesh position={[-1.2 + i * 0.35, 0.35 + i * 0.28, 0]}>
            <boxGeometry args={[2.2 - i * 0.35, 0.22, 1.1]} />
            <meshStandardMaterial color={i === 2 ? '#16827e' : i % 2 ? '#2a2a2a' : '#1b2230'} roughness={0.5} />
          </mesh>
        </Hot>
      ))}
    </group>
  )
}

function PhysicsRoom({ onNote }: { onNote: (n: Note) => void }) {
  const g = fieldGuide('physics')
  const note: Note = g
    ? { title: g.fact.title, text: g.fact.text, source: g.fact.source.url }
    : { title: 'Physics', text: `${Object.values(getWorld().categories.find((c) => c.id === 'physics')?.difficulties ?? {}).reduce((a, b) => a + b, 0)} questions.` }
  const geo = useMemo(() => {
    const gg = new THREE.BufferGeometry()
    gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(48 * 3), 3))
    return gg
  }, [])
  const mat = useMemo(() => new THREE.PointsMaterial({ color: '#e8c9a0', size: 0.05, transparent: true, opacity: 0.9 }), [])
  useFrame(() => {
    const t = performance.now() / 1000
    const arr = geo.attributes.position.array as Float32Array
    for (let i = 0; i < 48; i++) {
      const u = i / 48
      const fall = (t * 0.2 + u) % 1
      const rad = 1.4 * (1 - fall * 0.9)
      const ang = u * Math.PI * 2 + t * 0.9
      arr[i * 3] = Math.cos(ang) * rad
      arr[i * 3 + 1] = 1.1 + Math.sin(ang * 2) * 0.05
      arr[i * 3 + 2] = Math.sin(ang) * rad * 0.45
    }
    geo.attributes.position.needsUpdate = true
  })
  return (
    <group>
      <Hot note={note} onNote={onNote}>
        <mesh position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.55, 32, 24]} />
          <meshStandardMaterial color="#0a0a0c" roughness={0.85} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2.2, 0.2, 0]}>
          <torusGeometry args={[1.05, 0.06, 12, 64]} />
          <meshStandardMaterial color="#c9a06a" emissive="#c9a06a" emissiveIntensity={0.35} />
        </mesh>
      </Hot>
      <points geometry={geo} material={mat} />
    </group>
  )
}

function DefaultRoom({ id, onNote }: { id: string; onNote: (n: Note) => void }) {
  const g = fieldGuide(id)
  const cat = getWorld().categories.find((c) => c.id === id)
  const n = cat ? Object.values(cat.difficulties).reduce((a, b) => a + b, 0) : 0
  const note: Note = g
    ? { title: g.fact.title, text: `${g.summary} ${g.fact.text}`, source: g.fact.source.url }
    : { title: id, text: n ? `${n} questions in this subject. No exhibit text is attached yet.` : 'No exhibit text is attached yet.' }
  return (
    <group>
      <Hot note={note} onNote={onNote}>
        <mesh position={[0, 0.9, 0]}>
          <dodecahedronGeometry args={[0.85, 0]} />
          <meshStandardMaterial color="#16827e" roughness={0.45} />
        </mesh>
      </Hot>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.45, 48]} />
        <meshStandardMaterial color="#16827e" roughness={0.5} />
      </mesh>
    </group>
  )
}

function Room({ id, onNote }: { id: string; onNote: (n: Note) => void }) {
  if (id === 'maths' || id === 'math') return <MathsRoom onNote={onNote} />
  if (id === 'python') return <PythonRoom onNote={onNote} />
  if (id === 'physics') return <PhysicsRoom onNote={onNote} />
  return <DefaultRoom id={id} onNote={onNote} />
}

function Lights({ dark }: { dark: boolean }) {
  return (
    <>
      <hemisphereLight args={[dark ? '#1a2838' : '#fff8ee', dark ? '#05080e' : '#e4dfd4', dark ? 0.9 : 1.4]} />
      <directionalLight position={[4, 8, 3]} intensity={dark ? 1.3 : 1.7} color={dark ? '#fff1dc' : '#ffffff'} />
      <directionalLight position={[-5, 2, -4]} intensity={0.45} color={dark ? '#f0dcc4' : '#ffe8c8'} />
    </>
  )
}

export default function PortalCanvas({
  id,
  onNote,
  registerReset,
}: {
  id: string
  onNote: (n: Note) => void
  registerReset: (fn: () => void) => void
}) {
  const [pal, setPal] = useState(() => palette())
  const [held, setHeld] = useState(false)
  const controls = useRef<ControlsHandle | null>(null)
  useEffect(() => onThemeChange(() => setPal(palette())), [])
  useEffect(() => {
    registerReset(() => controls.current?.reset())
  }, [registerReset])
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [0, 2.1, 5.2], fov: 42, near: 0.1, far: 40 }}
      onCreated={({ scene }) => {
        scene.background = pal.canvas.clone()
        scene.fog = new THREE.Fog(pal.canvas.clone(), 8, 18)
      }}
    >
      <Lights dark={pal.dark} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[6.5, 48]} />
        <meshStandardMaterial color={pal.dark ? '#121820' : '#f7f4ee'} roughness={1} />
      </mesh>
      <Room id={id} onNote={onNote} />
      <OrbitControls
        ref={controls as never}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate={!held && !reduce}
        autoRotateSpeed={0.45}
        minDistance={2.4}
        maxDistance={9}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.05}
        onStart={() => setHeld(true)}
        onEnd={() => setHeld(false)}
      />
    </Canvas>
  )
}
