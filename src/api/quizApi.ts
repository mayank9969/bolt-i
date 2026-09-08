import type {
  CategoriesResponse,
  HistoryEntry,
  QuizConfig,
  QuizResult,
  QuizSession,
} from '@/types/quiz'

// ══════════════════════════════════════════════════════════════
//  API CLIENT
//  Single connection point between the UI and the Python engine
//  (exposed by api/server.py or backend/app.py). Relative `/api`
//  by default — the dev server / local adapter route it to Flask.
//  In production VITE_API_BASE_URL (see .env.production) points at
//  the hosted API, e.g. https://backend-fc24.onrender.com/api
// ══════════════════════════════════════════════════════════════

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      ...init,
    })
  } catch {
    throw new ApiError('Could not reach the VEYRA server.', 0)
  }

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Request failed (${res.status})`
    throw new ApiError(message, res.status)
  }
  return data as T
}

export function getCategories(): Promise<CategoriesResponse> {
  return request<CategoriesResponse>('/categories')
}

export function startQuiz(config: QuizConfig): Promise<QuizSession> {
  return request<QuizSession>('/quiz/start', {
    method: 'POST',
    body: JSON.stringify({
      category: config.category,
      difficulty: config.difficulty,
      count: config.questionCount,
    }),
  })
}

export function submitQuiz(sessionId: string, answers: string[]): Promise<QuizResult> {
  return request<QuizResult>('/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, answers }),
  })
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const data = await request<{ history: HistoryEntry[] }>('/history')
  return data.history
}
