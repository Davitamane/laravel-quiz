import type { UseQuizReturn } from '../hooks/useQuiz'

export function HomeScreen({
  stats,
  onStart,
  onResume,
  onReset,
  hasProgress,
}: {
  stats: UseQuizReturn['stats']
  onStart: () => void
  onResume: () => void
  onReset: () => void
  hasProgress: boolean
}) {
  const scorePct =
    stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : 0

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-500">
          Laravel Quiz
        </p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Practice Test</h1>
        <p className="mt-3 text-slate-600">
          {stats.total} multiple-choice questions extracted from your testportal
          screenshots. Progress saves automatically in your browser.
        </p>

        <dl className="mt-8 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <dt className="text-sm text-slate-500">Questions</dt>
            <dd className="text-2xl font-bold text-slate-900">{stats.total}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <dt className="text-sm text-slate-500">Answered</dt>
            <dd className="text-2xl font-bold text-slate-900">{stats.answered}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-center">
            <dt className="text-sm text-slate-500">Score</dt>
            <dd className="text-2xl font-bold text-slate-900">
              {stats.answered > 0 ? `${scorePct}%` : '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onStart}
            className="rounded-xl bg-red-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-red-600"
          >
            {hasProgress ? 'Start from beginning' : 'Start quiz'}
          </button>
          {hasProgress && (
            <button
              type="button"
              onClick={onResume}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Resume
            </button>
          )}
          {hasProgress && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-xl px-6 py-3 font-semibold text-slate-500 transition hover:text-slate-800"
            >
              Reset progress
            </button>
          )}
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Note: Q281 is missing from the source screenshots. Some bug/cropped images
          had answers inferred from Laravel docs.
        </p>
      </div>
    </div>
  )
}
