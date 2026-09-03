import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { QuizConfig, QuizResult, QuizSession } from '@/types/quiz'

interface QuizContextValue {
  config: QuizConfig | null
  session: QuizSession | null
  result: QuizResult | null
  beginSession: (config: QuizConfig, session: QuizSession) => void
  finishSession: (result: QuizResult) => void
  reset: () => void
}

const QuizContext = createContext<QuizContextValue | null>(null)

export function QuizProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<QuizConfig | null>(null)
  const [session, setSession] = useState<QuizSession | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)

  const value = useMemo<QuizContextValue>(
    () => ({
      config,
      session,
      result,
      beginSession: (cfg, sess) => {
        setConfig(cfg)
        setSession(sess)
        setResult(null)
      },
      finishSession: (res) => {
        setResult(res)
        setSession(null)
      },
      reset: () => {
        setConfig(null)
        setSession(null)
        setResult(null)
      },
    }),
    [config, session, result],
  )

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>
}

export function useQuiz() {
  const ctx = useContext(QuizContext)
  if (!ctx) throw new Error('useQuiz must be used within QuizProvider')
  return ctx
}
