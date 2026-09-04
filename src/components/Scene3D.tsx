import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Icosahedron, MeshDistortMaterial, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { onThemeChange, readToken, tokenHex } from '@/lib/theme'

/**
 * NEXUS core scene — an abstract "nexus": a distorted core, orbiting rings,
 * connected nodes and a few floating cards. The palette is read from the
 * active theme's tokens: neutral bodies, one accent, so the scene supports
 * the UI instead of competing with it.
 */

interface Palette {
  accent: string
  accentSoft: string
  core: string
  card: string
  line: string
  text: string
}

function readPalette(): Palette {
  return {
    accent: tokenHex('--nx-accent-rgb'),
    accentSoft: tokenHex('--nx-accent-2-rgb'),
    core: readToken('--nx-3d-core') || '#10162a',
    card: readToken('--nx-3d-card') || '#161d2c',
    line: readToken('--nx-3d-line') || '#8b93a6',
    text: tokenHex('--nx-text-rgb'),
  }
}

const PaletteCtx = createContext<Palette>({
  accent: '#ff6a3c',
  accentSoft: '#ffb08f',
  core: '#10162a',
  card: '#161d2c',
  line: '#8b93a6',
  text: '#f2efe6',
})
const usePalette = () => useContext(PaletteCtx)

function CameraParallax({ strength = 1 }: { strength?: number }) {
  const { camera, pointer } = useThree()
  useFrame(() => {
    const tx = pointer.x * 0.55 * strength
    const ty = pointer.y * 0.35 * strength
    camera.position.x += (tx - camera.position.x) * 0.035
    camera.position.y += (ty - camera.position.y) * 0.035
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Core() {
  const p = usePalette()
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.08
  })
  return (
    <Float speed={1} rotationIntensity={0.15} floatIntensity={0.4}>
      <mesh ref={ref} position={[0, 0, -2]}>
        <Icosahedron args={[1.25, 2]}>
          <MeshDistortMaterial
            color={p.core}
            metalness={0.85}
            roughness={0.25}
            distort={0.22}
            speed={1.3}
            emissive={p.accent}
            emissiveIntensity={0.04}
          />
        </Icosahedron>
      </mesh>
      {/* wire shell */}
      <mesh position={[0, 0, -2]} scale={1.35}>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshBasicMaterial color={p.line} wireframe transparent opacity={0.07} />
      </mesh>
    </Float>
  )
}

function Ring({ radius, tilt, speed, opacity = 0.28, accent = false }: { radius: number; tilt: [number, number, number]; speed: number; opacity?: number; accent?: boolean }) {
  const p = usePalette()
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = s.clock.elapsedTime * speed
  })
  return (
    <mesh ref={ref} rotation={tilt} position={[0, 0, -2]}>
      <torusGeometry args={[radius, 0.012, 12, 128]} />
      <meshStandardMaterial
        color={accent ? p.accentSoft : p.line}
        emissive={accent ? p.accent : p.line}
        emissiveIntensity={accent ? 0.5 : 0.15}
        transparent
        opacity={opacity}
      />
    </mesh>
  )
}

/** Nodes connected by a thin line — the "nexus" motif. */
function Constellation({ count = 7, spread = 5 }: { count?: number; spread?: number }) {
  const pal = usePalette()
  const group = useRef<THREE.Group>(null)
  const nodes = useMemo(() => {
    const rnd = mulberry32(7)
    return Array.from({ length: count }, () => new THREE.Vector3(
      (rnd() - 0.5) * spread,
      (rnd() - 0.5) * spread * 0.6,
      (rnd() - 0.5) * 2 - 1,
    ))
  }, [count, spread])

  const lineGeo = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < nodes.length - 1; i++) {
      pts.push(nodes[i], nodes[i + 1])
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [nodes])

  useFrame((s) => {
    if (group.current) group.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.08) * 0.15
  })

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial color={pal.line} transparent opacity={0.18} />
      </lineSegments>
      {nodes.map((p, i) => (
        <Float key={i} speed={1.4} floatIntensity={0.35} rotationIntensity={0}>
          <mesh position={p}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? pal.accentSoft : pal.text}
              emissive={i % 3 === 0 ? pal.accent : pal.text}
              emissiveIntensity={i % 3 === 0 ? 1.4 : 0.5}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

function Card({ position, rotation, scale = 1 }: { position: [number, number, number]; rotation: [number, number, number]; scale?: number }) {
  const p = usePalette()
  const ref = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (!ref.current) return
    ref.current.rotation.y = rotation[1] + Math.sin(s.clock.elapsedTime * 0.3) * 0.12
    ref.current.rotation.x = rotation[0] + Math.cos(s.clock.elapsedTime * 0.22) * 0.08
  })
  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.7}>
      <group ref={ref} position={position} scale={scale}>
        <RoundedBox args={[1.7, 1.05, 0.07]} radius={0.09} smoothness={4}>
          <meshStandardMaterial color={p.card} metalness={0.7} roughness={0.3} transparent opacity={0.94} />
        </RoundedBox>
        {/* accent bar */}
        <mesh position={[-0.45, 0.28, 0.045]}>
          <boxGeometry args={[0.55, 0.06, 0.01]} />
          <meshStandardMaterial color={p.text} emissive={p.text} emissiveIntensity={0.35} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[-0.2 + i * 0.02, 0.02 - i * 0.2, 0.045]}>
            <boxGeometry args={[1.05 - i * 0.2, 0.035, 0.01]} />
            <meshStandardMaterial color={p.line} transparent opacity={0.4} />
          </mesh>
        ))}
        {/* selected option marker */}
        <mesh position={[0.55, -0.35, 0.05]}>
          <circleGeometry args={[0.08, 24]} />
          <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={1} />
        </mesh>
      </group>
    </Float>
  )
}

function Dust({ count = 40 }: { count?: number }) {
  const p = usePalette()
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const rnd = mulberry32(21)
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rnd() - 0.5) * 12
      arr[i * 3 + 1] = (rnd() - 0.5) * 7
      arr[i * 3 + 2] = (rnd() - 0.5) * 5 - 1
    }
    return arr
  }, [count])
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.01
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color={p.text} transparent opacity={0.4} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Scene3DProps {
  variant?: 'hero' | 'ambient'
  /** lower-power variant for small screens */
  lite?: boolean
}

export default function Scene3D({ variant = 'hero', lite = false }: Scene3DProps) {
  const [palette, setPalette] = useState<Palette>(() => readPalette())
  useEffect(() => onThemeChange(() => setPalette(readPalette())), [])

  return (
    <PaletteCtx.Provider value={palette}>
      <Canvas
        key={palette.accent /* re-create materials on theme change */}
        camera={{ position: [0, 0, 5.2], fov: 48 }}
        dpr={lite ? [1, 1.25] : [1, 1.75]}
        gl={{ antialias: !lite, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
        frameloop="always"
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[4, 5, 6]} intensity={0.9} />
        <pointLight position={[-5, -3, 2]} intensity={0.7} color={palette.accent} />
        <pointLight position={[5, 3, -2]} intensity={0.3} color={palette.text} />

        <CameraParallax strength={variant === 'hero' ? 1 : 0.6} />

        <Core />
        <Ring radius={1.9} tilt={[1.2, 0.2, 0]} speed={0.07} accent />
        <Ring radius={2.4} tilt={[1.5, -0.35, 0]} speed={-0.045} opacity={0.22} />
        {!lite && <Ring radius={3.0} tilt={[1.05, 0.55, 0]} speed={0.03} opacity={0.16} />}

        <Constellation count={lite ? 5 : 8} spread={variant === 'hero' ? 6 : 4.5} />

        {variant === 'hero' && (
          <>
            <Card position={[2.5, 0.9, 0.4]} rotation={[0.1, -0.35, 0.04]} scale={0.7} />
            <Card position={[3.1, -1.2, -0.3]} rotation={[0.15, -0.5, -0.05]} scale={0.55} />
            {!lite && <Card position={[-3.0, -1.4, -0.4]} rotation={[-0.05, 0.4, 0.06]} scale={0.5} />}
          </>
        )}

        <Dust count={lite ? 20 : 45} />
      </Canvas>
    </PaletteCtx.Provider>
  )
}
