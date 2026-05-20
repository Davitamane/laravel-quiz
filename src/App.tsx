import { useQuiz } from './hooks/useQuiz'
import { HomeScreen } from './components/HomeScreen'
import { QuizScreen } from './components/QuizScreen'
import { ReviewScreen } from './components/ReviewScreen'

function App() {
  const quiz = useQuiz()

  const hasPracticeProgress =
    quiz.practiceStats.answered > 0 || quiz.practiceProgress.currentIndex > 0

  if (quiz.screen === 'home') {
    return (
      <HomeScreen
        practiceStats={quiz.practiceStats}
        examStats={quiz.examStats}
        practiceProgress={quiz.practiceProgress}
        examProgress={quiz.examProgress}
        onStartPractice={() => {
          if (hasPracticeProgress) quiz.startPracticeFresh()
          else quiz.startPractice()
        }}
        onResumePractice={quiz.resumePractice}
        onResetPractice={quiz.resetPractice}
        onStartExam={quiz.startExam}
        onResumeExam={quiz.resumeExam}
        onResetExam={quiz.resetExam}
      />
    )
  }

  if (quiz.screen === 'review') {
    return (
      <ReviewScreen
        questions={quiz.questions}
        answers={quiz.progress.answers}
        mode={quiz.activeMode}
        onGoTo={quiz.goTo}
        onHome={() => quiz.setScreen('home')}
      />
    )
  }

  return <QuizScreen quiz={quiz} />
}

export default App
