import { useMemo, useState } from 'react';
import { getWordOfDay, getRandomWords } from '@/lib/wordBank';
import { isFavoriteWord, toggleFavoriteWord } from '@/lib/localProgress';
import { Volume2, Heart, RefreshCcw } from 'lucide-react';

export default function WordOfDayCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [shuffle, setShuffle] = useState(0);

  const word = useMemo(() => {
    if (shuffle > 0) {
      return getRandomWords(1)[0];
    }
    return getWordOfDay();
  }, [shuffle, refreshKey]);

  const isFavorite = word ? isFavoriteWord(word.id) || favoriteIds.includes(word.id) : false;

  const handleSpeak = () => {
    if (!word || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleFavorite = () => {
    if (!word) return;
    const next = toggleFavoriteWord(word.id);
    setFavoriteIds(next);
  };

  if (!word) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-100 dark:border-gray-700 transition-colors duration-300" data-test="home-word-of-day">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Word of the Day</p>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">{word.word}</h3>
        </div>
        <button
          onClick={() => setShuffle((v) => v + 1)}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-700"
          title="Shuffle"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{word.translation}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Example: {word.example}</p>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSpeak}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
        >
          <Volume2 className="w-4 h-4" /> Hear it
        </button>
        <button
          onClick={handleToggleFavorite}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border ${
            isFavorite
              ? 'bg-red-500 text-white border-red-500'
              : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
          {isFavorite ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}
