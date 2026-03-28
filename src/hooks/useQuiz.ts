import { useState, useCallback } from 'react'
import { SIGNS, getImageUrl } from '../data/signs'
import { generateQuestions } from '../utils/quizGenerator'
import type { QuizMode, Question } from '../utils/quizGenerator'

export type Screen = 'home' | 'quiz' | 'results'

export interface AnsweredQuestion {
  question: Question
  selectedId: string
  correct: boolean
}

interface QuizState {
  screen: Screen
  questions: Question[]
  currentIndex: number
  answered: AnsweredQuestion[]
  mode: QuizMode
  total: number
  /** id of the choice just selected, for feedback highlight */
  selectedId: string | null
}

const initialState: QuizState = {
  screen: 'home',
  questions: [],
  currentIndex: 0,
  answered: [],
  mode: 'nameToSign',
  total: 20,
  selectedId: null,
}

export function useQuiz() {
  const [state, setState] = useState<QuizState>(initialState)

  const startQuiz = useCallback((mode: QuizMode, total: number) => {
    const questions = generateQuestions(SIGNS, mode, total)
    setState({
      screen: 'quiz',
      questions,
      currentIndex: 0,
      answered: [],
      mode,
      total,
      selectedId: null,
    })
  }, [])

  const answer = useCallback((selectedId: string) => {
    setState(prev => {
      if (prev.screen !== 'quiz' || prev.selectedId !== null) return prev
      const question = prev.questions[prev.currentIndex]
      const correct = question.correctSign.id === selectedId

      // Mark selection immediately for visual feedback
      return { ...prev, selectedId }

      // The actual advance is triggered after a timeout (see below)
      void { question, correct } // suppress unused warning
    })

    // Preload next question's images during the 1s feedback window
    setState(prev => {
      const nextIndex = prev.currentIndex + 1
      if (nextIndex < prev.questions.length) {
        const next = prev.questions[nextIndex]
        next.choices.forEach(c => { new Image().src = getImageUrl(c.id) })
        new Image().src = getImageUrl(next.correctSign.id)
      }
      return prev
    })

    // Advance after 1 second
    setTimeout(() => {
      setState(prev => {
        if (prev.selectedId === null) return prev
        const question = prev.questions[prev.currentIndex]
        const correct = question.correctSign.id === prev.selectedId
        const newAnswered: AnsweredQuestion[] = [
          ...prev.answered,
          { question, selectedId: prev.selectedId, correct },
        ]
        const nextIndex = prev.currentIndex + 1
        const done = nextIndex >= prev.questions.length

        return {
          ...prev,
          answered: newAnswered,
          currentIndex: nextIndex,
          selectedId: null,
          screen: done ? 'results' : 'quiz',
        }
      })
    }, 1000)
  }, [])

  const goHome = useCallback(() => {
    setState(initialState)
  }, [])

  const retryQuiz = useCallback(() => {
    setState(prev => {
      const questions = generateQuestions(SIGNS, prev.mode, prev.total)
      return {
        screen: 'quiz',
        questions,
        currentIndex: 0,
        answered: [],
        mode: prev.mode,
        total: prev.total,
        selectedId: null,
      }
    })
  }, [])

  return { state, startQuiz, answer, goHome, retryQuiz }
}
