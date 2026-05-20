export interface QuizOption {
  id: string
  text: string
}

export interface Question {
  id: number
  prompt: string
  code: string | null
  options: QuizOption[]
  correctAnswer: string
  correctIndex: number
}

export interface AnswerRecord {
  selectedIndex: number
  correct: boolean
}

export type QuizAnswers = Record<number, AnswerRecord>

export type QuizMode = 'practice' | 'exam'

export const EXAM_SIZE = 40
export const PASS_THRESHOLD = 0.7

export interface QuizProgress {
  mode: QuizMode
  currentIndex: number
  answers: QuizAnswers
  startedAt: string
  questionIds?: number[]
}
