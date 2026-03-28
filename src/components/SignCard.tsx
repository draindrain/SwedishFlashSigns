import { useState } from 'react'
import { getImageUrl } from '../data/signs'

interface Props {
  id: string
  name: string
  /** visual state for feedback */
  state?: 'default' | 'correct' | 'wrong' | 'disabled'
  onClick?: () => void
  /** Show name label below image (for results review) */
  showLabel?: boolean
}

const stateClasses: Record<NonNullable<Props['state']>, string> = {
  default:  'border-gray-200 bg-white hover:border-blue-400 hover:shadow-md cursor-pointer',
  correct:  'border-green-500 bg-green-50 ring-2 ring-green-300 cursor-default shadow-sm',
  wrong:    'border-red-500 bg-red-50 ring-2 ring-red-300 cursor-default shadow-sm',
  disabled: 'border-gray-200 bg-white opacity-40 cursor-default',
}

export default function SignCard({ id, name, state = 'default', onClick, showLabel }: Props) {
  const [imgError, setImgError] = useState(false)

  return (
    <button
      onClick={state === 'default' ? onClick : undefined}
      disabled={state !== 'default'}
      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border shadow-sm transition-all select-none ${stateClasses[state]}`}
    >
      {/* Feedback icon */}
      {state === 'correct' && (
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">✓</span>
      )}
      {state === 'wrong' && (
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">✗</span>
      )}

      {/* Sign image */}
      <div className="w-full aspect-square flex items-center justify-center">
        {imgError ? (
          <div className="w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center px-1">
            {id}
          </div>
        ) : (
          <img
            src={getImageUrl(id)}
            alt={name}
            className="max-w-full max-h-full object-contain"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {showLabel && (
        <p className="mt-2 text-xs text-gray-600 text-center leading-tight">{name}</p>
      )}
    </button>
  )
}
