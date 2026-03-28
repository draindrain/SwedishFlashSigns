import type { QuizMode } from '../utils/quizGenerator'
import { useState } from 'react'
import { SIGNS } from '../data/signs'

interface Props {
  onStart: (mode: QuizMode, total: number) => void
}

const SET_SIZES = [20, 50, 100] as const

export default function HomeScreen({ onStart }: Props) {
  const [mode, setMode] = useState<QuizMode>('nameToSign')
  const [total, setTotal] = useState<number>(20)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-4">🚦</div>
          <h1 className="text-3xl font-bold text-gray-900">Svenska Vägmärken</h1>
          <p className="mt-2 text-gray-500 text-sm">
            {SIGNS.length} vägmärken från alla kategorier
          </p>
        </div>

        {/* Mode selection */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Svarsläge
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setMode('nameToSign')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                mode === 'nameToSign'
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold">Namn → Skylt</div>
              <div className="text-sm mt-1 opacity-75">
                Se ett namn, välj rätt skyltbild bland fyra alternativ
              </div>
            </button>
            <button
              onClick={() => setMode('signToName')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                mode === 'signToName'
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold">Skylt → Namn</div>
              <div className="text-sm mt-1 opacity-75">
                Se en skyltbild, välj rätt namn bland fyra alternativ
              </div>
            </button>
          </div>
        </div>

        {/* Set size */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Antal frågor
          </h2>
          <div className="flex gap-3">
            {SET_SIZES.map(size => (
              <button
                key={size}
                onClick={() => setTotal(size)}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${
                  total === size
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={() => onStart(mode, total)}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg rounded-xl transition-colors shadow-lg"
        >
          Starta övning
        </button>
      </div>
    </div>
  )
}
