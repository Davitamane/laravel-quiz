import { useQuiz } from './hooks/useQuiz'
import { HomeScreen } from './components/HomeScreen'
import { QuizScreen } from './components/QuizScreen'
import { ReviewScreen } from './components/ReviewScreen'

function App() {
  const quiz = useQuiz()
  const hasProgress = quiz.stats.answered > 0 || quiz.progress.currentIndex > 0

  if (quiz.screen === 'home') {
    return (
      <HomeScreen
        stats={quiz.stats}
        hasProgress={hasProgress}
        onStart={() => {
          if (hasProgress) quiz.startFresh()
          else quiz.start()
        }}
        onResume={quiz.resume}
        onReset={quiz.reset}
      />
    )
  }

  if (quiz.screen === 'review') {
    return (
      <ReviewScreen
        questions={quiz.questions}
        answers={quiz.progress.answers}
        onGoTo={(index) => {
          quiz.goTo(index)
          quiz.setRevealed(Boolean(quiz.progress.answers[quiz.questions[index]?.id]))
        }}
        onHome={() => quiz.setScreen('home')}
      />
    )
  }

  return <QuizScreen quiz={quiz} />
}

export default App
