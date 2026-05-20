import type { Question, QuizAnswers, QuizMode } from '../types'
import { PASS_THRESHOLD } from '../types'

export function ReviewScreen({
  questions,
  answers,
  mode,
  onGoTo,
  onHome,
}: {
  questions: Question[]
  answers: QuizAnswers
  mode: QuizMode
  onGoTo: (index: number) => void
  onHome: () => void
}) {
  const answered = Object.values(answers)
  const correct = answered.filter((a) => a.correct).length
  const total = questions.length
  const scorePct = total > 0 ? Math.round((correct / total) * 100) : 0
  const accuracyPct =
    answered.length > 0 ? Math.round((correct / answered.length) * 100) : 0
  const isExam = mode === 'exam'
  const passed = isExam && scorePct >= PASS_THRESHOLD * 100
  const passCount = Math.ceil(total * PASS_THRESHOLD)

  const wrongQuestions = questions.filter(
    (q) => answers[q.id] && !answers[q.id].correct,
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {isExam && (
          <div
            className={`mb-6 rounded-2xl border px-6 py-5 text-center ${
              passed
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <p
              className={`text-sm font-semibold uppercase tracking-wide ${
                passed ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {passed ? 'Passed' : 'Failed'}
            </p>
            <p
              className={`mt-1 text-3xl font-bold ${
                passed ? 'text-emerald-900' : 'text-red-900'
              }`}
            >
              {scorePct}%
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {correct} of {total} correct — need {passCount}+ to pass (
              {Math.round(PASS_THRESHOLD * 100)}%)
            </p>
          </div>
        )}

        <h1 className="text-3xl font-bold text-slate-900">
          {isExam ? 'Exam Results' : 'Quiz Summary'}
        </h1>
        <p className="mt-2 text-slate-600">
          You answered {answered.length} of {total} questions.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Correct" value={String(correct)} />
          <Stat label="Wrong" value={String(answered.length - correct)} />
          <Stat
            label={isExam ? 'Score' : 'Accuracy'}
            value={`${isExam ? scorePct : accuracyPct}%`}
          />
          <Stat label="Unanswered" value={String(total - answered.length)} />
        </div>

        {wrongQuestions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Review incorrect</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {wrongQuestions.map((q) => {
                const index = questions.findIndex((item) => item.id === q.id)
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onGoTo(index)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Q{q.id}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onHome}
            className="rounded-xl bg-red-500 px-5 py-2.5 font-semibold text-white hover:bg-red-600"
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-center">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
