import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Icosahedron, MeshDistortMaterial, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

/**
 * NEXUS core scene — an abstract "nexus": a distorted core, orbiting rings,
 * connected nodes and a few floating cards. Palette is intentionally limited
 * to navy + cyan so it supports the UI instead of competing with it.
 */

const CYAN = '#2cc4f5'
const CYAN_SOFT = '#5ddcff'
const NAVY = '#111930'
const NAVY_2 = '#1c2540'

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
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.08
  })
  return (
    <Float speed={1} rotationIntensity={0.15} floatIntensity={0.4}>
      <mesh ref={ref} position={[0, 0, -2]}>
        <Icosahedron args={[1.25, 2]}>
          <MeshDistortMaterial
            color={NAVY}
            metalness={0.85}
            roughness={0.2}
            distort={0.22}
            speed={1.3}
            emissive={CYAN}
            emissiveIntensity={0.06}
          />
        </Icosahedron>
      </mesh>
      {/* wire shell */}
      <mesh position={[0, 0, -2]} scale={1.35}>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.06} />
      </mesh>
    </Float>
  )
}

function Ring({ radius, tilt, speed, opacity = 0.28 }: { radius: number; tilt: [number, number, number]; speed: number; opacity?: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = s.clock.elapsedTime * speed
  })
  return (
    <mesh ref={ref} rotation={tilt} position={[0, 0, -2]}>
      <torusGeometry args={[radius, 0.012, 12, 128]} />
      <meshStandardMaterial color={CYAN_SOFT} emissive={CYAN} emissiveIntensity={0.4} transparent opacity={opacity} />
    </mesh>
  )
}

/** Nodes connected by a thin line — the "nexus" motif. */
function Constellation({ count = 7, spread = 5 }: { count?: number; spread?: number }) {
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
        <lineBasicMaterial color={CYAN} transparent opacity={0.16} />
      </lineSegments>
      {nodes.map((p, i) => (
        <Float key={i} speed={1.4} floatIntensity={0.35} rotationIntensity={0}>
          <mesh position={p}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshStandardMaterial color={CYAN_SOFT} emissive={CYAN} emissiveIntensity={1.4} />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

function Card({ position, rotation, scale = 1, tone = NAVY }: { position: [number, number, number]; rotation: [number, number, number]; scale?: number; tone?: string }) {
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
          <meshStandardMaterial color={tone} metalness={0.75} roughness={0.28} transparent opacity={0.92} />
        </RoundedBox>
        {/* accent bar */}
        <mesh position={[-0.45, 0.28, 0.045]}>
          <boxGeometry args={[0.55, 0.06, 0.01]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.9} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[-0.2 + i * 0.02, 0.02 - i * 0.2, 0.045]}>
            <boxGeometry args={[1.05 - i * 0.2, 0.035, 0.01]} />
            <meshStandardMaterial color={'#9fadcc'} transparent opacity={0.35} />
          </mesh>
        ))}
        {/* selected option marker */}
        <mesh position={[0.55, -0.35, 0.05]}>
          <circleGeometry args={[0.08, 24]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1} />
        </mesh>
      </group>
    </Float>
  )
}

function Dust({ count = 40 }: { count?: number }) {
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
      <pointsMaterial size={0.035} color={CYAN_SOFT} transparent opacity={0.55} sizeAttenuation depthWrite={false} />
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
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 48 }}
      dpr={lite ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: !lite, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
      frameloop="always"
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 6]} intensity={0.9} />
      <pointLight position={[-5, -3, 2]} intensity={0.8} color={CYAN} />
      <pointLight position={[5, 3, -2]} intensity={0.35} color={CYAN_SOFT} />

      <CameraParallax strength={variant === 'hero' ? 1 : 0.6} />

      <Core />
      <Ring radius={1.9} tilt={[1.2, 0.2, 0]} speed={0.07} />
      <Ring radius={2.4} tilt={[1.5, -0.35, 0]} speed={-0.045} opacity={0.2} />
      {!lite && <Ring radius={3.0} tilt={[1.05, 0.55, 0]} speed={0.03} opacity={0.14} />}

      <Constellation count={lite ? 5 : 8} spread={variant === 'hero' ? 6 : 4.5} />

      {variant === 'hero' && (
        <>
          <Card position={[2.5, 0.9, 0.4]} rotation={[0.1, -0.35, 0.04]} scale={0.7} />
          <Card position={[3.1, -1.2, -0.3]} rotation={[0.15, -0.5, -0.05]} scale={0.55} tone={NAVY_2} />
          {!lite && <Card position={[-3.0, -1.4, -0.4]} rotation={[-0.05, 0.4, 0.06]} scale={0.5} tone={NAVY_2} />}
        </>
      )}

      <Dust count={lite ? 20 : 45} />
    </Canvas>
  )
}
