import type { QuizMode } from '../utils/quizGenerator'
import { useState } from 'react'

interface Props {
  onStart: (mode: QuizMode, total: number) => void
}

const SET_SIZES = [20, 50, 100] as const

export default function HomeScreen({ onStart }: Props) {
  const [mode, setMode] = useState<QuizMode>('nameToSign')
  const [total, setTotal] = useState<number>(20)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-10">
        {/* Header */}
        <div className="text-center">
          <div className="mb-5 mx-auto w-16 h-16 bg-blue-600 rotate-45 rounded-md flex items-center justify-center shadow-md">
            <span className="text-white font-black text-xl -rotate-45 tracking-tight">SV</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Svenska Vägmärken</h1>
          <p className="mt-2 text-gray-500 text-base font-normal">Flashcards för körkortet</p>
        </div>

        {/* Mode selection */}
        <div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Svarsläge
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setMode('nameToSign')}
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === 'nameToSign'
                  ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="font-semibold">Namn → Skylt</div>
              <div className="text-sm mt-1 opacity-75">
                Se ett namn, välj rätt skyltbild bland fyra alternativ
              </div>
            </button>
            <button
              onClick={() => setMode('signToName')}
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === 'signToName'
                  ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
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
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            Antal frågor
          </h2>
          <div className="flex gap-3">
            {SET_SIZES.map(size => (
              <button
                key={size}
                onClick={() => setTotal(size)}
                className={`flex-1 py-3 rounded-xl border font-semibold transition-all ${
                  total === size
                    ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
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
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          Starta övning
        </button>
      </div>
    </div>
  )
}
