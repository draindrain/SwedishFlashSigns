import type { Question } from '../utils/quizGenerator'
import type { TrafficSign } from '../data/signs'
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

function SignImage({ sign }: { sign: TrafficSign }) {
  const [imgError, setImgError] = useState(false)
  if (imgError) {
    return (
      <div className="w-40 h-40 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-semibold text-lg">
        {sign.id}
      </div>
    )
  }
  return (
    <img
      src={getImageUrl(sign)}
      alt={sign.name}
      className="w-40 h-40 object-contain"
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <button
          onClick={onQuit}
          className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
        >
          ✕ Avsluta
        </button>
        <div className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <div className="text-sm text-gray-500 whitespace-nowrap">
          {questionNumber}/{total}
        </div>
      </div>

      {/* Score */}
      <div className="text-center pt-4 pb-2">
        <span className="text-sm text-gray-500">
          Rätt: <span className="font-semibold text-green-600">{correctCount}</span>
          {questionNumber > 1 && <> / {questionNumber - 1}</>}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pb-8 pt-4 gap-6">

        {/* Prompt area */}
        {mode === 'nameToSign' ? (
          <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
              Välj rätt skylt för
            </p>
            <p className="text-xl font-bold text-gray-900 leading-snug">
              {correctSign.name}
            </p>
            <p className="text-xs text-gray-400 mt-2">{correctSign.categoryName}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Vilket är namnet på denna skylt?
            </p>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <SignImage sign={correctSign} />
            </div>
            <p className="text-xs text-gray-400">{correctSign.categoryName}</p>
          </div>
        )}

        {/* Choices */}
        {mode === 'nameToSign' ? (
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {choices.map(sign => (
              <SignCard
                key={sign.id}
                sign={sign}
                state={getCardState(sign.id, correctSign.id, selectedId)}
                onClick={() => onAnswer(sign.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full max-w-sm">
            {choices.map(sign => {
              const cs = getCardState(sign.id, correctSign.id, selectedId)
              const base = 'w-full px-4 py-3 rounded-xl border-2 text-left font-medium transition-all text-sm leading-snug'
              const variantClass =
                cs === 'correct' ? 'border-green-500 bg-green-50 text-green-900 ring-2 ring-green-400 cursor-default'
                : cs === 'wrong'   ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-400 cursor-default'
                : cs === 'disabled'? 'border-gray-200 bg-white text-gray-400 opacity-50 cursor-default'
                : 'border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:shadow-sm cursor-pointer'
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
