import { useQuiz } from './hooks/useQuiz'
import HomeScreen from './components/HomeScreen'
import QuizScreen from './components/QuizScreen'
import ResultsScreen from './components/ResultsScreen'

export default function App() {
  const { state, startQuiz, answer, goHome, retryQuiz } = useQuiz()

  if (state.screen === 'home') {
    return <HomeScreen onStart={startQuiz} />
  }

  if (state.screen === 'quiz') {
    const question = state.questions[state.currentIndex]
    return (
      <QuizScreen
        question={question}
        questionNumber={state.currentIndex + 1}
        total={state.total}
        selectedId={state.selectedId}
        correctCount={state.answered.filter(a => a.correct).length}
        onAnswer={answer}
        onQuit={goHome}
      />
    )
  }

  return (
    <ResultsScreen
      answered={state.answered}
      onRetry={retryQuiz}
      onHome={goHome}
    />
  )
}
