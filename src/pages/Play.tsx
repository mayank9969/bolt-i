import { useWorld } from '@/components/three/world'

/**
 * Practice is the supplied VEYRA relay site (zero / curiosity), served as-is.
 * Home / archipelago is not used here.
 */
export default function Play() {
  useWorld({ mode: 'quiet' })

  return (
    <iframe
      title="VEYRA Practice"
      src="/practice-relay/index.html?eye=3"
      className="w-full border-0 block bg-[#FBF7EC] overflow-auto"
      style={{ height: 'calc(100dvh - var(--veyra-header, 5.25rem))', minHeight: 0 }}
    />
  )
}
