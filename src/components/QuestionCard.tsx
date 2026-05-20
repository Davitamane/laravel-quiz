import type { Question } from '../types'
import { CodeBlock } from './CodeBlock'

interface QuestionCardProps {
  question: Question
  selectedIndex: number | null
  revealed: boolean
  onSelect: (index: number) => void
}

function optionClass(selected: boolean, correct: boolean, wrong: boolean) {
  if (correct) return 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
  if (wrong) return 'border-red-400 bg-red-50 ring-2 ring-red-200'
  if (selected) return 'border-red-400 bg-red-50'
  return 'border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/40'
}

export function QuestionCard({
  question,
  selectedIndex,
  revealed,
  onSelect,
}: QuestionCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold leading-snug text-slate-900">
        {question.prompt}
      </h2>

      {question.code && (
        <div className="mt-4">
          <CodeBlock code={question.code} />
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedIndex === index
          const isCorrect = revealed && index === question.correctIndex
          const isWrong = revealed && isSelected && index !== question.correctIndex

          return (
            <li key={`${option.id}-${index}`}>
              <button
                type="button"
                disabled={revealed}
                onClick={() => onSelect(index)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${optionClass(isSelected, isCorrect, isWrong)} disabled:cursor-default`}
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                  {option.id}
                </span>
                <span className="flex-1 whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-800">
                  {option.text}
                </span>
                {isCorrect && (
                  <span className="shrink-0 text-sm font-medium text-emerald-600">Correct</span>
                )}
                {isWrong && (
                  <span className="shrink-0 text-sm font-medium text-red-600">Wrong</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {revealed && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Answer: </span>
          <span className="font-mono">{question.correctAnswer}</span>
        </div>
      )}
    </article>
  )
}
