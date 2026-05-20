import type { UseQuizReturn } from '../hooks/useQuiz'
import { EXAM_SIZE, PASS_THRESHOLD } from '../types'

function ModeCard({
  title,
  description,
  stats,
  passLabel,
  onStart,
  onResume,
  onReset,
  hasProgress,
  startLabel,
}: {
  title: string
  description: string
  stats: UseQuizReturn['stats']
  passLabel?: string
  onStart: () => void
  onResume: () => void
  onReset: () => void
  hasProgress: boolean
  startLabel: string
}) {
  const scorePct =
    stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  const accuracyPct =
    stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {passLabel && (
        <p className="mt-2 text-sm font-medium text-slate-700">{passLabel}</p>
      )}

      <dl className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white p-3 text-center">
          <dt className="text-xs text-slate-500">Questions</dt>
          <dd className="text-lg font-bold text-slate-900">{stats.total}</dd>
        </div>
        <div className="rounded-xl bg-white p-3 text-center">
          <dt className="text-xs text-slate-500">Answered</dt>
          <dd className="text-lg font-bold text-slate-900">{stats.answered}</dd>
        </div>
        <div className="rounded-xl bg-white p-3 text-center">
          <dt className="text-xs text-slate-500">
            {stats.total === EXAM_SIZE ? 'Score' : 'Accuracy'}
          </dt>
          <dd className="text-lg font-bold text-slate-900">
            {stats.answered > 0 || stats.total === EXAM_SIZE
              ? `${stats.total === EXAM_SIZE ? scorePct : accuracyPct}%`
              : '—'}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onStart}
          className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
        >
          {startLabel}
        </button>
        {hasProgress && (
          <button
            type="button"
            onClick={onResume}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-white/80"
          >
            Resume
          </button>
        )}
        {hasProgress && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-slate-800"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

export function HomeScreen({
  practiceStats,
  examStats,
  practiceProgress,
  examProgress,
  onStartPractice,
  onResumePractice,
  onResetPractice,
  onStartExam,
  onResumeExam,
  onResetExam,
}: {
  practiceStats: UseQuizReturn['practiceStats']
  examStats: UseQuizReturn['examStats']
  practiceProgress: UseQuizReturn['practiceProgress']
  examProgress: UseQuizReturn['examProgress']
  onStartPractice: () => void
  onResumePractice: () => void
  onResetPractice: () => void
  onStartExam: () => void
  onResumeExam: () => void
  onResetExam: () => void
}) {
  const hasPracticeProgress =
    practiceStats.answered > 0 || practiceProgress.currentIndex > 0
  const hasExamProgress =
    examStats.answered > 0 ||
    examProgress.currentIndex > 0 ||
    (examProgress.questionIds?.length ?? 0) > 0

  const passCount = Math.ceil(EXAM_SIZE * PASS_THRESHOLD)

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-500">
          Laravel Quiz
        </p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Practice & Exam</h1>
        <p className="mt-3 text-slate-600">
          {practiceStats.total} multiple-choice questions from your testportal
          screenshots. Progress saves automatically in your browser.
        </p>

        <div className="mt-8 space-y-4">
          <ModeCard
            title="Practice mode"
            description="Work through the full question bank at your own pace with instant feedback."
            stats={practiceStats}
            hasProgress={hasPracticeProgress}
            startLabel={hasPracticeProgress ? 'Start from beginning' : 'Start practice'}
            onStart={onStartPractice}
            onResume={onResumePractice}
            onReset={onResetPractice}
          />

          <ModeCard
            title="Exam mode"
            description={`${EXAM_SIZE} random questions each attempt. Unanswered questions count against your score.`}
            passLabel={`Pass with ${Math.round(PASS_THRESHOLD * 100)}% or higher (${passCount}+ correct).`}
            stats={{
              ...examStats,
              total: hasExamProgress ? examStats.total : EXAM_SIZE,
            }}
            hasProgress={hasExamProgress}
            startLabel="New exam"
            onStart={onStartExam}
            onResume={onResumeExam}
            onReset={onResetExam}
          />
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Note: Q281 is missing from the source screenshots. Some bug/cropped images
          had answers inferred from Laravel docs.
        </p>
      </div>
    </div>
  )
}
