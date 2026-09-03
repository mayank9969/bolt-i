// ─────────────────────────────────────────────────────────────
//  Shapes shared between the UI and the Python API adapter.
//  These mirror the data produced by quiz.app/quiz.py exactly.
// ─────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard'
export type DifficultyChoice = Difficulty | 'mixed'
export type CategoryChoice = string // real category id or 'all'

export type QuestionType = 'normal' | 'mcq'

/** A question as delivered to the browser — the answer is never included. */
export interface QuizQuestion {
  id: number
  question: string
  category: string
  difficulty: Difficulty
  question_type: QuestionType
  options: Record<string, string> | null
}

export interface CategoryInfo {
  id: string
  difficulties: Record<string, number>
}

export interface CategoriesResponse {
  categories: CategoryInfo[]
  total_questions: number
}

export interface QuizConfig {
  category: CategoryChoice
  difficulty: DifficultyChoice
  questionCount: number
}

export interface QuizSession {
  session_id: string
  category: string
  difficulty: string
  questions: QuizQuestion[]
}

export interface ReviewItem {
  question: string
  question_type: QuestionType
  options: Record<string, string> | null
  difficulty: Difficulty
  category: string
  marks: number
  user_answer: string
  correct_answer: string
  is_correct: boolean
}

export interface QuizResult {
  category: string
  difficulty: string
  total_questions: number
  correct_answers: number
  wrong_answers: number
  score: number
  total_marks: number
  percentage: number
  review: ReviewItem[]
}

export interface HistoryEntry {
  attempt: number
  category: string
  difficulty: string
  total_questions: number
  correct_answers: number
  wrong_answers: number
  score: number
  total_marks: number
  percentage: number
}
