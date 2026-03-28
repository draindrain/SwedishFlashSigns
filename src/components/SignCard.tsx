import { useState } from 'react'
import { getImageUrl } from '../data/signs'
import type { TrafficSign } from '../data/signs'

interface Props {
  sign: TrafficSign
  /** visual state for feedback */
  state?: 'default' | 'correct' | 'wrong' | 'disabled'
  onClick?: () => void
  /** Show name label below image (for results review) */
  showLabel?: boolean
}

const stateClasses: Record<NonNullable<Props['state']>, string> = {
  default:  'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer',
  correct:  'border-green-500 bg-green-50 ring-2 ring-green-400 cursor-default',
  wrong:    'border-red-500 bg-red-50 ring-2 ring-red-400 cursor-default',
  disabled: 'border-gray-200 bg-white opacity-50 cursor-default',
}

export default function SignCard({ sign, state = 'default', onClick, showLabel }: Props) {
  const [imgError, setImgError] = useState(false)

  return (
    <button
      onClick={state === 'default' ? onClick : undefined}
      disabled={state !== 'default'}
      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all select-none ${stateClasses[state]}`}
    >
      {/* Feedback icon */}
      {state === 'correct' && (
        <span className="absolute top-2 right-2 text-green-500 text-lg">✓</span>
      )}
      {state === 'wrong' && (
        <span className="absolute top-2 right-2 text-red-500 text-lg">✗</span>
      )}

      {/* Sign image */}
      <div className="w-24 h-24 flex items-center justify-center">
        {imgError ? (
          <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center px-1">
            {sign.id}
          </div>
        ) : (
          <img
            src={getImageUrl(sign)}
            alt={sign.name}
            className="max-w-full max-h-full object-contain"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {showLabel && (
        <p className="mt-2 text-xs text-gray-600 text-center leading-tight">{sign.name}</p>
      )}
    </button>
  )
}
