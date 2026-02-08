import { useEffect, useMemo, useRef, useState } from 'react';
import { recordPractice } from '@/lib/localProgress';
import { Timer, Pause, Play, RotateCcw } from 'lucide-react';

const durations = [5, 10, 25];

export default function FocusTimerCard({ onComplete }: { onComplete?: () => void }) {
  const [minutes, setMinutes] = useState(durations[1]);
  const [remaining, setRemaining] = useState(durations[1] * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setRemaining(minutes * 60);
    setIsRunning(false);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [minutes]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsRunning(false);
          recordPractice({ minutes, xp: minutes * 2, sessions: 1 });
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, minutes, onComplete]);

  const formatted = useMemo(() => {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [remaining]);

  const handleReset = () => {
    setRemaining(minutes * 60);
    setIsRunning(false);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-100 dark:border-gray-700 transition-colors duration-300" data-test="home-focus-timer">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
          <Timer className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Focus Timer</p>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Deep Study Mode</h3>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-800 dark:text-white tracking-widest">{formatted}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Earn {minutes * 2} XP when completed.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning((v) => !v)}
            className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center hover:bg-purple-600"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleReset}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {durations.map((d) => (
          <button
            key={d}
            onClick={() => setMinutes(d)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              d === minutes
                ? 'bg-purple-500 text-white'
                : 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300'
            }`}
          >
            {d} min
          </button>
        ))}
      </div>
    </div>
  );
}
