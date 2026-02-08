import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { CheckCircle, XCircle, Star, Flame } from "lucide-react";
import { recordPractice } from "@/lib/localProgress";

interface Exercise {
  id: number;
  question: string;
  userAnswer?: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  exerciseOptions?: { id: number; text: string }[];
}

interface LessonSummaryProps {
  exercises: Exercise[];
  onBack: () => void;
  totalXp?: number;
  streak?: number;
}

const LessonSummary: React.FC<LessonSummaryProps> = ({ exercises, onBack, totalXp = 0, streak = 0 }) => {
  const recordedRef = useRef(false);

  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      zIndex: 9999,
    });
  }, []);

  // Calculate correct answers
  const correctCount = exercises.filter(ex => ex.isCorrect).length;
  const total = exercises.length;

  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    recordPractice({ xp: totalXp, lessons: 1, correct: correctCount, total, sessions: 1 });
  }, [correctCount, total, totalXp]);

  return (
    <section className="w-full max-w-3xl min-h-screen mx-auto bg-white flex flex-col items-center justify-center" data-test="lesson-summary">
      {/* Celebratory Header */}
      <div className="flex flex-col items-center justify-center mb-1">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-green-600 mb-1 text-center drop-shadow-lg">🎉 Congratulations! 🎉</h2>
        <p className="text-lg sm:text-xl text-gray-800 text-center font-light">You completed this lesson!</p>
      </div>
      {/* Progress & XP */}
      <div className="flex flex-row items-center justify-center gap-8 mb-8 w-full" data-test="lesson-summary-stats">
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500">XP Earned</span>
          <span className="flex items-center gap-1 text-2xl font-bold text-orange-500"><Star className="w-6 h-6" />{totalXp}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500">Streak</span>
          <span className="flex items-center gap-1 text-2xl font-bold text-red-500"><Flame className="w-6 h-6" />{streak}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500">Correct</span>
          <span className="flex items-center gap-1 text-2xl font-bold text-green-600">{correctCount}/{total}</span>
        </div>
      </div>
      {/* Exercise Recap as Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5 mb-10" data-test="lesson-summary-recap">
        {exercises.map((ex, idx) => (
          <div key={ex.id} className="flex flex-col bg-white/90 rounded-2xl shadow-lg p-5 h-full min-h-[120px] justify-between border-2 border-yellow-100" data-test={`lesson-summary-card-${ex.id}`}>
            <div className="flex items-center gap-2 mb-2">
              {ex.isCorrect ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400" />
              )}
              <span className="font-semibold text-gray-800">{idx + 1}. {ex.question}</span>
            </div>
            <div className="mt-2 text-sm">
              <span className="font-bold text-gray-700">Correct answer: </span>
              <span className="text-green-600 font-bold">{ex.correctAnswer}</span>
            </div>
          </div>
        ))}
      </div>
      {/* CTA Button */}
      <button
        onClick={onBack}
        data-test="lesson-summary-back"
        className="w-full sm:w-auto mt-2 bg-gradient-to-r 
        from-[#fbb124] to-[#ffa600] 
        hover:from-[#ffa600] hover:to-[#ffa600] text-white
        text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition 
        transform hover:scale-[1.02] focus:scale-[0.98] px-10 py-4 text-xl"
      >
        Back to Home
      </button>
    </section>
  );
};

export default LessonSummary; 
