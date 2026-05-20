import { useCallback, useEffect, useMemo, useState } from 'react'
import questionsData from '../data/questions.json'
import type { Question, QuizProgress } from '../types'

const STORAGE_KEY = 'laravel-quiz-progress'
const questions = questionsData as Question[]

function loadProgress(): QuizProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as QuizProgress
  } catch {
    /* ignore */
  }
  return { currentIndex: 0, answers: {}, startedAt: new Date().toISOString() }
}

export function useQuiz() {
  const [progress, setProgress] = useState<QuizProgress>(loadProgress)
  const [screen, setScreen] = useState<'home' | 'quiz' | 'review'>('home')
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [progress])

  const currentQuestion = questions[progress.currentIndex]
  const total = questions.length

  const stats = useMemo(() => {
    const answered = Object.keys(progress.answers).length
    const correct = Object.values(progress.answers).filter((a) => a.correct).length
    return { answered, correct, total }
  }, [progress.answers])

  const selectAnswer = useCallback(
    (optionIndex: number) => {
      if (revealed || !currentQuestion) return
      const correct = optionIndex === currentQuestion.correctIndex
      setProgress((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: { selectedIndex: optionIndex, correct },
        },
      }))
      setRevealed(true)
    },
    [currentQuestion, revealed],
  )

  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, total - 1))
    setProgress((prev) => {
      const q = questions[clamped]
      setRevealed(Boolean(q && prev.answers[q.id]))
      return { ...prev, currentIndex: clamped }
    })
    setScreen('quiz')
  }, [total])

  const next = useCallback(() => {
    if (progress.currentIndex >= total - 1) {
      setScreen('review')
      return
    }
    goTo(progress.currentIndex + 1)
  }, [goTo, progress.currentIndex, total])

  const prev = useCallback(() => {
    goTo(progress.currentIndex - 1)
  }, [goTo, progress.currentIndex])

  const startFresh = useCallback(() => {
    setProgress({
      currentIndex: 0,
      answers: {},
      startedAt: new Date().toISOString(),
    })
    setRevealed(false)
    setScreen('quiz')
  }, [])

  const start = useCallback(() => {
    setScreen('quiz')
    setRevealed(false)
  }, [])

  const reset = useCallback(() => {
    const fresh: QuizProgress = {
      currentIndex: 0,
      answers: {},
      startedAt: new Date().toISOString(),
    }
    setProgress(fresh)
    setRevealed(false)
    setScreen('home')
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const resume = useCallback(() => {
    setScreen('quiz')
    const q = questions[progress.currentIndex]
    setRevealed(Boolean(progress.answers[q?.id]))
  }, [progress.currentIndex, progress.answers])

  return {
    questions,
    currentQuestion,
    progress,
    screen,
    revealed,
    stats,
    selectAnswer,
    goTo,
    next,
    prev,
    start,
    startFresh,
    reset,
    resume,
    setScreen,
    setRevealed,
  }
}

export type UseQuizReturn = ReturnType<typeof useQuiz>
