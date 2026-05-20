import type { Question, QuizAnswers } from '../types'

export function ReviewScreen({
  questions,
  answers,
  onGoTo,
  onHome,
}: {
  questions: Question[]
  answers: QuizAnswers
  onGoTo: (index: number) => void
  onHome: () => void
}) {
  const answered = Object.values(answers)
  const correct = answered.filter((a) => a.correct).length
  const pct = answered.length > 0 ? Math.round((correct / answered.length) * 100) : 0

  const wrongIds = questions
    .filter((q) => answers[q.id] && !answers[q.id].correct)
    .map((q) => q.id)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Quiz Summary</h1>
        <p className="mt-2 text-slate-600">
          You answered {answered.length} of {questions.length} questions.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Correct" value={String(correct)} />
          <Stat label="Wrong" value={String(answered.length - correct)} />
          <Stat label="Accuracy" value={`${pct}%`} />
          <Stat label="Unanswered" value={String(questions.length - answered.length)} />
        </div>

        {wrongIds.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Review incorrect</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {wrongIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onGoTo(id - 1)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Q{id}
                </button>
              ))}
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
