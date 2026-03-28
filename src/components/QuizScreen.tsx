import type { Question } from '../utils/quizGenerator'
import SignCard from './SignCard'
import { getImageUrl } from '../data/signs'
import { useState } from 'react'

interface Props {
  question: Question
  questionNumber: number
  total: number
  selectedId: string | null
  correctCount: number
  onAnswer: (id: string) => void
  onQuit: () => void
}

function SignImage({ id, name }: { id: string; name: string }) {
  const [imgError, setImgError] = useState(false)
  if (imgError) {
    return (
      <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-lg">
        {id}
      </div>
    )
  }
  return (
    <img
      src={getImageUrl(id)}
      alt={name}
      className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
      onError={() => setImgError(true)}
    />
  )
}

function getCardState(
  choiceId: string,
  correctId: string,
  selectedId: string | null
): 'default' | 'correct' | 'wrong' | 'disabled' {
  if (selectedId === null) return 'default'
  if (choiceId === correctId) return 'correct'
  if (choiceId === selectedId) return 'wrong'
  return 'disabled'
}

export default function QuizScreen({
  question,
  questionNumber,
  total,
  selectedId,
  correctCount,
  onAnswer,
  onQuit,
}: Props) {
  const { correctSign, choices, mode } = question
  const progress = (questionNumber - 1) / total

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-4">
        <button
          onClick={onQuit}
          className="text-slate-400 hover:text-red-500 transition-colors text-sm"
        >
          ✕ Avsluta
        </button>
        <div className="flex-1">
          {/* Progress bar */}
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <div className="text-sm text-slate-600 font-semibold whitespace-nowrap">
          {questionNumber}/{total}
        </div>
      </div>

      {/* Score */}
      <div className="text-center pt-4 pb-2">
        <span className="text-sm text-slate-500">
          Rätt: <span className="font-semibold text-green-600">{correctCount}</span>
          {questionNumber > 1 && (
            <> / {questionNumber - 1}</>
          )}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pb-8 pt-4 gap-6">

        {/* Prompt area */}
        {mode === 'nameToSign' ? (
          /* Show name, pick sign */
          <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-100 shadow-md p-8 text-center">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
              Välj rätt skylt för
            </p>
            <p className="text-xl font-bold text-slate-900 leading-snug">
              {correctSign.name}
            </p>
            <p className="text-xs text-slate-400 mt-2">{correctSign.categoryName}</p>
          </div>
        ) : (
          /* Show sign, pick name */
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Vilket är namnet på denna skylt?
            </p>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-5">
              <SignImage id={correctSign.id} name={correctSign.name} />
            </div>
            <p className="text-xs text-slate-400">{correctSign.categoryName}</p>
          </div>
        )}

        {/* Choices */}
        {mode === 'nameToSign' ? (
          /* 2x2 sign image grid */
          <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
            {choices.map(sign => (
              <SignCard
                key={sign.id}
                id={sign.id}
                name={sign.name}
                state={getCardState(sign.id, correctSign.id, selectedId)}
                onClick={() => onAnswer(sign.id)}
              />
            ))}
          </div>
        ) : (
          /* 4 name buttons */
          <div className="flex flex-col gap-3 w-full max-w-lg">
            {choices.map(sign => {
              const cs = getCardState(sign.id, correctSign.id, selectedId)
              const base = 'w-full px-4 py-3 rounded-xl border text-left font-medium transition-all text-sm leading-snug'
              const variantClass =
                cs === 'correct' ? 'border-green-500 bg-green-50 text-green-900 ring-2 ring-green-400 cursor-default'
                : cs === 'wrong'   ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-400 cursor-default'
                : cs === 'disabled'? 'border-slate-200 bg-white text-slate-400 opacity-50 cursor-default'
                : 'border-slate-200 bg-white text-slate-800 hover:border-amber-300 hover:shadow-sm cursor-pointer'
              return (
                <button
                  key={sign.id}
                  onClick={cs === 'default' ? () => onAnswer(sign.id) : undefined}
                  disabled={cs !== 'default'}
                  className={`${base} ${variantClass}`}
                >
                  {cs === 'correct' && <span className="mr-2">✓</span>}
                  {cs === 'wrong'   && <span className="mr-2">✗</span>}
                  {sign.name}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
