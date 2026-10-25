import { useMemo } from 'react'
import { Clone, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const ISLANDS = [
  '/models/veyra_floating_island_01.glb',
  '/models/veyra_floating_island_02.glb',
  '/models/veyra_floating_island_03.glb',
  '/models/veyra_floating_island_04.glb',
] as const

export const TREE_DETAIL = '/models/veyra_canopy_tree_detail.glb'
export const TREE_FOREST = '/models/veyra_canopy_tree_forest.glb'

ISLANDS.forEach((u) => useGLTF.preload(u))
useGLTF.preload(TREE_DETAIL)
useGLTF.preload(TREE_FOREST)

function fit(scene: THREE.Object3D, targetSpan: number) {
  const box = new THREE.Box3().setFromObject(scene)
  const size = box.getSize(new THREE.Vector3())
  const span = Math.max(size.x, size.z, 0.001)
  return targetSpan / span
}

export function IslandModel({ variant, radius }: { variant: number; radius: number }) {
  const url = ISLANDS[variant % 4]
  const { scene } = useGLTF(url)
  const scale = useMemo(() => fit(scene, radius * 2.3), [scene, radius])
  return (
    <group scale={scale}>
      <Clone object={scene} castShadow receiveShadow />
    </group>
  )
}

export function SubjectTree({ scale = 1, yaw = 0 }: { scale?: number; yaw?: number }) {
  const { scene } = useGLTF(TREE_DETAIL)
  return (
    <group scale={scale * 0.22} rotation={[0, yaw, 0]}>
      <Clone object={scene} castShadow receiveShadow />
    </group>
  )
}

export function ForestTree({ scale = 1, yaw = 0 }: { scale?: number; yaw?: number }) {
  const { scene } = useGLTF(TREE_FOREST)
  return (
    <group scale={scale * 0.35} rotation={[0, yaw, 0]}>
      <Clone object={scene} castShadow receiveShadow />
    </group>
  )
}
