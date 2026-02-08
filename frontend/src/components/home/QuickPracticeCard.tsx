import { useEffect, useMemo, useState } from 'react';
import { buildQuiz, QuizQuestion, wordBank } from '@/lib/wordBank';
import { recordPractice } from '@/lib/localProgress';
import { Sparkles, CheckCircle2 } from 'lucide-react';

const XP_PER_CORRECT = 3;

export default function QuickPracticeCard({ onComplete }: { onComplete?: () => void }) {
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setQuiz(buildQuiz(5));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }, []);

  const current = quiz[index];

  const handleSubmit = () => {
    if (!current || !selected) return;
    const correct = selected === current.answer;
    if (correct) setScore((s) => s + 1);
    if (index + 1 < quiz.length) {
      setIndex((i) => i + 1);
      setSelected(null);
    } else {
      const totalXp = (correct ? score + 1 : score) * XP_PER_CORRECT;
      recordPractice({ xp: totalXp, words: quiz.length, correct: correct ? score + 1 : score, total: quiz.length });
      setFinished(true);
      onComplete?.();
    }
  };

  const handleReset = () => {
    setQuiz(buildQuiz(5));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  const lastScore = useMemo(() => score, [score]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-100 dark:border-gray-700 transition-colors duration-300" data-test="home-quick-practice">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Quick Practice</p>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">5-Question Sprint</h3>
        </div>
      </div>

      {!finished && current && (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Question {index + 1} of {quiz.length}</p>
          <div className="rounded-xl border border-dashed border-blue-200 dark:border-blue-700 p-4 bg-blue-50/60 dark:bg-blue-900/20 mb-4">
            <p className="text-xl font-bold text-gray-800 dark:text-white">{current.word}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pick the correct translation.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {current.options.map((option) => {
              const isSelected = option === selected;
              return (
                <button
                  key={option}
                  onClick={() => setSelected(option)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:border-blue-300'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tip: {wordBank.find((w) => w.word === current.word)?.tip || 'Say it out loud to lock it in.'}
            </p>
            <button
              onClick={handleSubmit}
              disabled={!selected}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              {index + 1 === quiz.length ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {finished && (
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </div>
          <h4 className="text-lg font-bold text-gray-800 dark:text-white">Sprint complete!</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You scored {lastScore} / {quiz.length} and earned {lastScore * XP_PER_CORRECT} XP.
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
          >
            Practice Again
          </button>
        </div>
      )}
    </div>
  );
}
