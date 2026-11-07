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
      className="w-full border-0 block bg-[#FBF7EC]"
      style={{ height: 'calc(100dvh - 4.25rem)', minHeight: 640 }}
    />
  )
}
