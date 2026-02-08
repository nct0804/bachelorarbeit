import { useState, useEffect, useRef } from "react"
import { CardContent } from "@/components/ui/card"
import { FillInBlankExercise } from "./FillInBlankExercise"
import { MultipleChoiceExercise } from "./MultipleChoiceExercise"
import LearningFooter from "./LearningFooter"
import { useLessonExercises } from "@/hooks/useLessonExercises"
import { useExerciseCheck } from "@/hooks/useExerciseCheck"
import { useNavigate } from "react-router-dom"
import LessonSummary from "./LessonSummary"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import StreakIcon from "../../assets/streak.png"
import XPIcon from "../../assets/XP-2.png"

export function LearningContent({ 
  lessonId,
  onProgressChange,
}: { lessonId: number, onProgressChange?: (current: number, total: number, summary?: boolean) => void }) {
  const { exercises, loading, error } = useLessonExercises(lessonId)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const { checkExercise, checkResult, checking, resetCheck } = useExerciseCheck()
  const navigate = useNavigate()
  const feedbackRef = useRef<HTMLDivElement>(null)
  const { refreshUser } = useAuth()
  const [exerciseResults, setExerciseResults] = useState<
    { id: number; question: string; userAnswer: string; correctAnswer: string; isCorrect: boolean; currentStreak: number; xpReward: number }[]
  >([]);
  const [shouldShowSummary, setShouldShowSummary] = useState(false);

  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(currentIdx + 1, exercises.length, currentIdx >= exercises.length)
    }
  }, [currentIdx, exercises.length, onProgressChange])

  useEffect(() => {
    if (!checkResult) return;
    if (!checkResult.isCorrect && feedbackRef.current) {
      feedbackRef.current.classList.remove("animate-shake");
      void feedbackRef.current.offsetWidth;
      feedbackRef.current.classList.add("animate-shake");
    }
  }, [checkResult]);

  useEffect(() => {
    if (currentIdx >= exercises.length) {
      setShouldShowSummary(true);
    } else {
      setShouldShowSummary(false);
    }
  }, [currentIdx, exercises.length]);

  if (loading) return console.log("Loading exercises for lessonId: ", lessonId)
  if (error) return console.log("Error: ", error)
  if (!exercises.length) return console.log("No exercises found for lessonId: ", lessonId)

  const ex = exercises[currentIdx]

  async function handleCheck() {
    if (selected === null && selectedText === null) return

    // if (ex.type === "VOCABULARY_CHECK") {
    //   setSelected(null)
    //   setSelectedText(null)
    //   resetCheck()
    //   setCurrentIdx(idx => idx + 1)
    //   return
    // }
    
    let answer: number | string
    if (ex.type === "FILL_IN_BLANK") {
      answer = selectedText || ""
    } else {
      answer = selected || 0
    }
    
    const result = await checkExercise(ex.id, answer)
    refreshUser(false);
    // Track user answer and correctness
    setExerciseResults(prev => {
      const filtered = prev.filter(r => r.id !== ex.id);
      return [
        ...filtered,
        {
          id: ex.id,
          question: ex.question,
          userAnswer: answer.toString(),
          correctAnswer: result.correctAnswer,
          isCorrect: result.isCorrect,
          currentStreak: result.currentStreak,
          xpReward: result.xpReward,
        }
      ];
    });
    
    // If correct, move to next exercise after a short delay
    if (result.isCorrect) {
      setTimeout(() => {
        setSelected(null)
        setSelectedText(null)
        resetCheck()
        setCurrentIdx(idx => idx + 1)
      }, 2500) // Show result for 2.5 seconds
    }
  }

  // If we have a check result, show feedback
  if (checkResult) {
    return (
      <CardContent className="flex-1 flex flex-col items-center justify-center px-6 py-8" data-test="learn-check-result">
        <div
          ref={feedbackRef}
          className={`relative text-center space-y-4 ${checkResult.isCorrect ? 'text-green-600' : 'text-red-600'}`}
          data-test={`learn-check-result-${checkResult.isCorrect ? 'correct' : 'incorrect'}`}
        >
          {checkResult.isCorrect ? (
            <div className="flex flex-col items-center animate-fade-in">
              <div className="mb-2">
                <svg className="w-20 h-20 text-green-500" fill="none" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="4" fill="white" />
                  <path d="M16 27L24 35L38 19" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-2">Great job!</p>
              <div className="flex gap-6 text-xl font-bold">
                <span className="flex items-center gap-1 text-orange-500">
                  <img src={XPIcon} alt="XP" className="w-7 h-7" />
                  {checkResult?.xpReward ?? 0}
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <img src={StreakIcon} alt="Streak" className="w-7 h-7" />
                  {checkResult?.currentStreak ?? 0}
                </span>
              </div>
              <p className="text-lg text-gray-500 mt-2">Keep up the streak!</p>
            </div>
          ) : ( // Incorrect answer
            <div className="flex flex-col items-center animate-fade-in">
              <div className="mb-2">
                <svg className="w-20 h-20 text-red-500 animate-shake" fill="none" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="4" fill="white" />
                  <line x1="16" y1="16" x2="36" y2="36" stroke="currentColor" strokeWidth="4" />
                  <line x1="36" y1="16" x2="16" y2="36" stroke="currentColor" strokeWidth="4" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-red-600 mb-2">Oops! Try again!</p>
              <div className="flex gap-6 text-xl font-bold">
                <span className="flex items-center gap-1 text-orange-500">
                  <img src={XPIcon} alt="XP" className="w-7 h-7" />
                  {checkResult?.xpReward ?? 0}
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <img src={StreakIcon} alt="Streak" className="w-7 h-7" />
                  {checkResult?.currentStreak ?? 0}
                </span>
              </div>
              <p className="text-lg text-gray-500 mt-2">Don't give up, you can do it!</p>
            </div>
          )}
          <div className="mt-6">
            {!checkResult.isCorrect && (
              <Button
              onClick={() => {
                setSelected(null)
                setSelectedText(null)
                resetCheck()
              }}
              data-test="learn-try-again"
              className="h-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition transform hover:scale-[1.02] focus:scale-[0.98]"
            >
              Try Again
            </Button>
            )}
          </div>
        </div>
      </CardContent>
    )
  }

  // Show congratulatory message and summary if all exercises are finished
  if (currentIdx >= exercises.length) {
    if (shouldShowSummary) {
      // Use the last exercise result's currentStreak for summary
      let streak = 0;
      if (exerciseResults.length > 0) {
        streak = exerciseResults[exerciseResults.length - 1].currentStreak || 0;
      }
      // Calculate total XP earned from correct answers
      const totalXp = exerciseResults.reduce((sum, r) => r.isCorrect ? sum + (r.xpReward || 0) : sum, 0);
      return (
        <LessonSummary
          exercises={exerciseResults}
          onBack={async () => { await refreshUser(loading); navigate('/home'); }}
          totalXp={totalXp}
          streak={streak}
        />
      );
    }
    // fallback: render nothing
    return null;
  }

  return (
    <CardContent className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 text-[#3B6978] w-full max-w-4xl mx-auto" data-test="learn-exercise">
      {/* Progress Indicator */}
      <div className="w-full flex justify-center items-center mb-4 sm:mb-6" data-test="learn-exercise-progress">
        <span className="text-sm font-bold text-[#3B6978]" data-test="learn-exercise-progress-text">Exercise {currentIdx + 1} of {exercises.length}</span>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center space-y-6 sm:space-y-8 w-full" data-test={`learn-exercise-${ex.type.toLowerCase()}`}>
        {ex.type === "FILL_IN_BLANK" && (() => {
          // Extract the part after the colon (if present)
          const fillText = ex.question.includes(":") ? ex.question.split(":").slice(1).join(":").trim() : ex.question;
          const [prefix, suffix] = fillText.split("_____");
          return (
            <FillInBlankExercise
              prefix={prefix || ""}
              suffix={suffix || ""}
              instruction={ex.instruction}
              onSelect={(text) => {
                setSelectedText(text)
              }}
              onEnter={handleCheck}
            />
          );
        })()}
        {ex.type === "MULTIPLE_CHOICE" && (
          <MultipleChoiceExercise
            question={ex.question}
            instruction={ex.instruction}
            options={ex.exerciseOptions}
            selected={selected}
            onSelect={setSelected}
          />
        )}
        {/* {ex.type === "VOCABULARY_CHECK" && (
          <VocabCheckExercise
            question={ex.question}
            instruction={ex.instruction}
            items={ex.exerciseOptions}
            selected={selected}
            onSelect={setSelected}
          />
        )}
        */}
      </div>
      
      <LearningFooter 
        handleCheck={handleCheck} 
        selected={!!selected || !!selectedText} 
        checking={checking}
        exerciseType={ex.type}
      />
    </CardContent>
  )
}

export default LearningContent;
