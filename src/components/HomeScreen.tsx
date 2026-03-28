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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-10">
        {/* Header */}
        <div className="text-center">
          <div className="mb-5 mx-auto w-20 h-20 rotate-45 bg-black p-[3px] shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-white p-[8px] flex items-center justify-center">
              <div className="w-full h-full bg-yellow-400 flex items-center justify-center">
                <span className="text-slate-900 font-black text-lg -rotate-45 tracking-tight">SV</span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Svenska Vägmärken</h1>
          <p className="mt-2 text-slate-500 text-base font-normal">Flashcards för körkortet</p>
        </div>

        {/* Mode selection */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            Svarsläge
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setMode('nameToSign')}
              className={`p-4 rounded-xl border text-left transition-all ${
                mode === 'nameToSign'
                  ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm'
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
                  ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm'
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
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            Antal frågor
          </h2>
          <div className="flex gap-3">
            {SET_SIZES.map(size => (
              <button
                key={size}
                onClick={() => setTotal(size)}
                className={`flex-1 py-3 rounded-xl border font-semibold transition-all ${
                  total === size
                    ? 'border-amber-400 bg-amber-400 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
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
          className="w-full py-4 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold text-lg rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          Starta övning
        </button>
      </div>
    </div>
  )
}
