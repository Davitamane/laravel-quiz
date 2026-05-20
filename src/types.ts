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

export interface QuizProgress {
  currentIndex: number
  answers: QuizAnswers
  startedAt: string
}
