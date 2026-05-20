import { ProgressBar } from './ProgressBar'
import { QuestionCard } from './QuestionCard'
import type { UseQuizReturn } from '../hooks/useQuiz'

export function QuizScreen({
  quiz,
}: {
  quiz: UseQuizReturn
}) {
  const {
    currentQuestion,
    progress,
    revealed,
    stats,
    selectAnswer,
    next,
    prev,
    goTo,
    setScreen,
  } = quiz

  if (!currentQuestion) return null

  const record = progress.answers[currentQuestion.id]
  const selectedIndex = record?.selectedIndex ?? null

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Home
        </button>
        <div className="flex items-center gap-2">
          <label htmlFor="jump" className="text-sm text-slate-500">
            Jump to
          </label>
          <input
            id="jump"
            type="number"
            min={1}
            max={stats.total}
            defaultValue={progress.currentIndex + 1}
            key={progress.currentIndex}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = Number((e.target as HTMLInputElement).value)
                if (val >= 1 && val <= stats.total) goTo(val - 1)
              }
            }}
            className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
      </header>

      <ProgressBar
        current={progress.currentIndex}
        total={stats.total}
        answered={stats.answered}
      />

      <div className="mt-6">
        <QuestionCard
          question={currentQuestion}
          selectedIndex={selectedIndex}
          revealed={revealed}
          onSelect={selectAnswer}
        />
      </div>

      <footer className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={prev}
          disabled={progress.currentIndex === 0}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={() => setScreen('review')}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          Summary
        </button>

        <button
          type="button"
          onClick={next}
          disabled={!revealed}
          className="rounded-xl bg-red-500 px-5 py-2.5 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {progress.currentIndex >= stats.total - 1 ? 'Finish' : 'Next'}
        </button>
      </footer>
    </div>
  )
}
