import { difficultyLevel, labelDifficulty } from '@/lib/format'

/**
 * Difficulty chip: label + 1–3 lit segments in a single colour.
 * Intensity instead of a colour code keeps the semantic palette free
 * for correctness and performance.
 */
export default function Tier({ difficulty, className = '' }: { difficulty: string; className?: string }) {
  const level = difficultyLevel(difficulty)
  return (
    <span className={`chip ${className}`} title={`${labelDifficulty(difficulty)} difficulty`}>
      <span className="tier text-fg-2" data-level={level} aria-hidden="true">
        <i /><i /><i />
      </span>
      {labelDifficulty(difficulty)}
    </span>
  )
}
