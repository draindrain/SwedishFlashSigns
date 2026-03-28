import type { AnsweredQuestion } from '../hooks/useQuiz'
import { getImageUrl } from '../data/signs'
import { useState } from 'react'

interface Props {
  answered: AnsweredQuestion[]
  onRetry: () => void
  onHome: () => void
}

function ReviewItem({ aq }: { aq: AnsweredQuestion }) {
  const { question, selectedId } = aq
  const { correctSign, choices } = question
  const wrongSign = choices.find(c => c.id === selectedId)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex gap-4 items-start">
        {/* Wrong answer */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-red-300 bg-red-50 flex items-center justify-center">
            <img
              src={getImageUrl(selectedId)}
              alt={wrongSign?.name ?? selectedId}
              className="max-w-full max-h-full object-contain p-1"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <span className="text-xs text-red-500 font-medium">Ditt svar</span>
          <p className="text-xs text-center text-gray-600 max-w-[80px] leading-tight">
            {wrongSign?.name ?? selectedId}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center pt-5 text-gray-400 text-xl font-bold">
          →
        </div>

        {/* Correct answer */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-green-400 bg-green-50 flex items-center justify-center">
            <img
              src={getImageUrl(correctSign.id)}
              alt={correctSign.name}
              className="max-w-full max-h-full object-contain p-1"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <span className="text-xs text-green-600 font-medium">Rätt svar</span>
          <p className="text-xs text-center text-gray-800 font-medium max-w-[80px] leading-tight">
            {correctSign.name}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-400">{correctSign.categoryName} · {correctSign.id}</p>
    </div>
  )
}

export default function ResultsScreen({ answered, onRetry, onHome }: Props) {
  const [showReview, setShowReview] = useState(false)
  const correct = answered.filter(a => a.correct).length
  const total = answered.length
  const pct = Math.round((correct / total) * 100)
  const wrong = answered.filter(a => !a.correct)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center pt-16 pb-16 px-4">
      <div className="max-w-lg w-full space-y-6">

        {/* Score card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-8 text-center">
          <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4 ${
            pct === 100 ? 'bg-yellow-400 text-yellow-900'
            : pct >= 80  ? 'bg-green-100 text-green-700'
            : pct >= 60  ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600'
          }`}>
            <span className="text-3xl font-black">{pct}%</span>
          </div>
          <div className="text-5xl font-black text-gray-900">{correct} / {total}</div>
          <div className="text-lg text-gray-600 mt-1">rätt svar</div>
          {wrong.length > 0 && (
            <div className="mt-3 text-sm text-gray-500">
              {wrong.length} {wrong.length === 1 ? 'felsvar' : 'felsvar'}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Försök igen
          </button>
          <button
            onClick={onHome}
            className="flex-1 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 transition-colors"
          >
            Ny session
          </button>
        </div>

        {/* Review wrong answers */}
        {wrong.length > 0 && (
          <div>
            <button
              onClick={() => setShowReview(v => !v)}
              className="w-full py-3 text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2"
            >
              {showReview ? '▲ Dölj felsvar' : `▼ Granska ${wrong.length} felsvar`}
            </button>

            {showReview && (
              <div className="space-y-3 mt-2">
                {wrong.map((aq, i) => (
                  <ReviewItem key={i} aq={aq} />
                ))}
              </div>
            )}
          </div>
        )}

        {wrong.length === 0 && (
          <p className="text-center text-green-600 font-bold text-base">
            Perfekt resultat! Inga felsvar.
          </p>
        )}
      </div>
    </div>
  )
}
