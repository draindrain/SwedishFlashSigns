import type { TrafficSign } from '../data/signs'

export type QuizMode = 'nameToSign' | 'signToName'

export interface Question {
  correctSign: TrafficSign
  choices: TrafficSign[]
  mode: QuizMode
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Words to ignore when comparing names for similarity */
const STOP_WORDS = new Set([
  'för', 'med', 'mot', 'och', 'av', 'en', 'ett', 'på', 'till',
  'i', 'om', 'är', 'inte', 'att', 'den', 'det',
])

function nameWords(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
  )
}

function sharesKeyWords(a: string, b: string): boolean {
  const wa = nameWords(a)
  const wb = nameWords(b)
  for (const w of wa) {
    if (wb.has(w)) return true
  }
  return false
}

function pickDistractors(
  correct: TrafficSign,
  all: TrafficSign[],
  count: number
): TrafficSign[] {
  const pool: TrafficSign[] = []
  const used = new Set<string>([correct.id])

  const addFromPool = (candidates: TrafficSign[]) => {
    for (const s of shuffle(candidates)) {
      if (!used.has(s.id) && pool.length < count) {
        pool.push(s)
        used.add(s.id)
      }
    }
  }

  // Priority 1: same category
  const sameCategory = all.filter(s => s.category === correct.category && s.id !== correct.id)
  addFromPool(sameCategory)

  // Priority 2: shares key words in name
  if (pool.length < count) {
    const sharedWords = all.filter(
      s => !used.has(s.id) && sharesKeyWords(s.name, correct.name)
    )
    addFromPool(sharedWords)
  }

  // Priority 3: any remaining sign
  if (pool.length < count) {
    const rest = all.filter(s => !used.has(s.id))
    addFromPool(rest)
  }

  return pool.slice(0, count)
}

export function generateQuestions(
  all: TrafficSign[],
  mode: QuizMode,
  total: number
): Question[] {
  if (all.length < 4) throw new Error('Need at least 4 signs')

  // Build a pool long enough for total questions (repeat cycle if needed)
  const basePool = shuffle([...all])
  const pool: TrafficSign[] = []
  while (pool.length < total) {
    pool.push(...shuffle([...basePool]))
  }
  const selected = pool.slice(0, total)

  return selected.map(correct => ({
    correctSign: correct,
    choices: shuffle([correct, ...pickDistractors(correct, all, 3)]),
    mode,
  }))
}
