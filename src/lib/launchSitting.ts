import { startQuiz } from '@/api/quizApi'
import type { DifficultyChoice, QuizConfig, QuizSession } from '@/types/quiz'

export async function launchSitting(
  config: QuizConfig,
  beginSession: (config: QuizConfig, session: QuizSession) => void,
  goQuiz: () => void,
  goSetup: (config: QuizConfig) => void,
) {
  try {
    const session = await startQuiz(config)
    beginSession(config, session)
    goQuiz()
  } catch {
    goSetup(config)
  }
}

export const mixedFive = (category: string): QuizConfig => ({
  category,
  difficulty: 'mixed' as DifficultyChoice,
  questionCount: 5,
})
