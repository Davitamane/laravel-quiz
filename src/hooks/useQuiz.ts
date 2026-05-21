import { useCallback, useEffect, useMemo, useState } from 'react'
import questionsData from '../data/questions.json'
import type { Question, QuizMode, QuizProgress } from '../types'
import { EXAM_SIZE, PASS_THRESHOLD } from '../types'

const ALL_QUESTIONS = questionsData as Question[]
const PRACTICE_KEY = 'laravel-quiz-progress-practice'
const EXAM_KEY = 'laravel-quiz-progress-exam'
const LEGACY_KEY = 'laravel-quiz-progress'

function defaultProgress(mode: QuizMode): QuizProgress {
  return { mode, currentIndex: 0, answers: {}, startedAt: new Date().toISOString() }
}

function storageKey(mode: QuizMode): string {
  return mode === 'exam' ? EXAM_KEY : PRACTICE_KEY
}

function revalidateAnswers(progress: QuizProgress): QuizProgress {
  const questions = getActiveQuestions(progress)
  const answers = { ...progress.answers }
  let changed = false

  for (const question of questions) {
    const record = answers[question.id]
    if (!record) continue

    const correct = record.selectedIndex === question.correctIndex
    if (record.correct !== correct) {
      answers[question.id] = { ...record, correct }
      changed = true
    }
  }

  return changed ? { ...progress, answers } : progress
}

function loadProgress(mode: QuizMode): QuizProgress {
  try {
    const raw = localStorage.getItem(storageKey(mode))
    if (raw) {
      const parsed = JSON.parse(raw) as QuizProgress
      return revalidateAnswers({ ...defaultProgress(mode), ...parsed, mode })
    }
    if (mode === 'practice') {
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        const parsed = JSON.parse(legacy) as QuizProgress
        return revalidateAnswers({ ...defaultProgress('practice'), ...parsed, mode: 'practice' })
      }
    }
  } catch {
    /* ignore */
  }
  return defaultProgress(mode)
}

function pickRandomQuestionIds(count: number): number[] {
  const ids = ALL_QUESTIONS.map((q) => q.id)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  return ids.slice(0, count)
}

function getActiveQuestions(progress: QuizProgress): Question[] {
  if (progress.mode === 'exam' && progress.questionIds?.length) {
    return progress.questionIds
      .map((id) => ALL_QUESTIONS.find((q) => q.id === id))
      .filter((q): q is Question => q !== undefined)
  }
  return ALL_QUESTIONS
}

function computeStats(progress: QuizProgress) {
  const questions = getActiveQuestions(progress)
  const total = questions.length
  const answered = Object.keys(progress.answers).length
  const correct = Object.values(progress.answers).filter((a) => a.correct).length
  const scorePct = total > 0 ? (correct / total) * 100 : 0
  const passed =
    progress.mode === 'exam' && total > 0 ? scorePct >= PASS_THRESHOLD * 100 : null

  return { answered, correct, total, scorePct, passed }
}

export function useQuiz() {
  const [practiceProgress, setPracticeProgress] = useState<QuizProgress>(() =>
    loadProgress('practice'),
  )
  const [examProgress, setExamProgress] = useState<QuizProgress>(() => loadProgress('exam'))
  const [activeMode, setActiveMode] = useState<QuizMode>('practice')
  const [screen, setScreen] = useState<'home' | 'quiz' | 'review'>('home')
  const [revealed, setRevealed] = useState(false)

  const activeProgress = activeMode === 'exam' ? examProgress : practiceProgress
  const setActiveProgress = activeMode === 'exam' ? setExamProgress : setPracticeProgress

  useEffect(() => {
    localStorage.setItem(storageKey('practice'), JSON.stringify(practiceProgress))
  }, [practiceProgress])

  useEffect(() => {
    localStorage.setItem(storageKey('exam'), JSON.stringify(examProgress))
  }, [examProgress])

  const questions = useMemo(() => getActiveQuestions(activeProgress), [activeProgress])
  const currentQuestion = questions[activeProgress.currentIndex]
  const total = questions.length

  const stats = useMemo(() => computeStats(activeProgress), [activeProgress])
  const practiceStats = useMemo(() => computeStats(practiceProgress), [practiceProgress])
  const examStats = useMemo(() => computeStats(examProgress), [examProgress])

  const selectAnswer = useCallback(
    (optionIndex: number) => {
      if (revealed || !currentQuestion) return
      const correct = optionIndex === currentQuestion.correctIndex
      setActiveProgress((prev) => ({
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.id]: { selectedIndex: optionIndex, correct },
        },
      }))
      setRevealed(true)
    },
    [currentQuestion, revealed, setActiveProgress],
  )

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, total - 1))
      setActiveProgress((prev) => {
        const q = questions[clamped]
        setRevealed(Boolean(q && prev.answers[q.id]))
        return { ...prev, currentIndex: clamped }
      })
      setScreen('quiz')
    },
    [total, questions, setActiveProgress],
  )

  const next = useCallback(() => {
    if (activeProgress.currentIndex >= total - 1) {
      setScreen('review')
      return
    }
    goTo(activeProgress.currentIndex + 1)
  }, [goTo, activeProgress.currentIndex, total])

  const prev = useCallback(() => {
    goTo(activeProgress.currentIndex - 1)
  }, [goTo, activeProgress.currentIndex])

  const startPractice = useCallback(() => {
    setActiveMode('practice')
    setScreen('quiz')
    setRevealed(false)
  }, [])

  const startPracticeFresh = useCallback(() => {
    setActiveMode('practice')
    setPracticeProgress(defaultProgress('practice'))
    setRevealed(false)
    setScreen('quiz')
  }, [])

  const startExam = useCallback(() => {
    setActiveMode('exam')
    setExamProgress({
      ...defaultProgress('exam'),
      questionIds: pickRandomQuestionIds(EXAM_SIZE),
    })
    setRevealed(false)
    setScreen('quiz')
  }, [])

  const resumePractice = useCallback(() => {
    setActiveMode('practice')
    setScreen('quiz')
    const q = getActiveQuestions(practiceProgress)[practiceProgress.currentIndex]
    setRevealed(Boolean(practiceProgress.answers[q?.id]))
  }, [practiceProgress])

  const resumeExam = useCallback(() => {
    setActiveMode('exam')
    setScreen('quiz')
    const q = getActiveQuestions(examProgress)[examProgress.currentIndex]
    setRevealed(Boolean(examProgress.answers[q?.id]))
  }, [examProgress])

  const resetPractice = useCallback(() => {
    setPracticeProgress(defaultProgress('practice'))
    if (activeMode === 'practice') {
      setRevealed(false)
      setScreen('home')
    }
    localStorage.removeItem(PRACTICE_KEY)
    localStorage.removeItem(LEGACY_KEY)
  }, [activeMode])

  const resetExam = useCallback(() => {
    setExamProgress(defaultProgress('exam'))
    if (activeMode === 'exam') {
      setRevealed(false)
      setScreen('home')
    }
    localStorage.removeItem(EXAM_KEY)
  }, [activeMode])

  return {
    questions,
    currentQuestion,
    progress: activeProgress,
    activeMode,
    screen,
    revealed,
    stats,
    practiceStats,
    examStats,
    practiceProgress,
    examProgress,
    selectAnswer,
    goTo,
    next,
    prev,
    startPractice,
    startPracticeFresh,
    startExam,
    resumePractice,
    resumeExam,
    resetPractice,
    resetExam,
    setScreen,
    setRevealed,
  }
}

export type UseQuizReturn = ReturnType<typeof useQuiz>
