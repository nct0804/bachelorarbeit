import ProgressBar from '../top-bar/ProgressBar'; 
import Logo from '../top-bar/Logo';
import ProfileAndStats from '../top-bar/ProfileAndStats';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

const germanQuotes = [
  { q: 'Übung macht den Meister.', a: 'Deutsches Sprichwort', translation: 'Practice makes perfect.' },
  { q: 'Der Apfel fällt nicht weit vom Stamm.', a: 'Deutsches Sprichwort', translation: 'The apple doesn\'t fall far from the tree.' },
  { q: 'Alle guten Dinge sind drei.', a: 'Deutsches Sprichwort', translation: 'All good things come in threes.' },
  { q: 'Morgenstund hat Gold im Mund.', a: 'Deutsches Sprichwort', translation: 'The early bird catches the worm.' },
  { q: 'Was du heute kannst besorgen, das verschiebe nicht auf morgen.', a: 'Deutsches Sprichwort', translation: 'Don\'t put off until tomorrow what you can do today.' },
  { q: 'Aller Anfang ist schwer.', a: 'Deutsches Sprichwort', translation: 'Every beginning is difficult.' },
  { q: 'Ende gut, alles gut.', a: 'Deutsches Sprichwort', translation: 'All\'s well that ends well.' },
  { q: 'Ohne Fleiß kein Preis.', a: 'Deutsches Sprichwort', translation: 'No pain, no gain.' },
  { q: 'Wer A sagt, muss auch B sagen.', a: 'Deutsches Sprichwort', translation: 'In for a penny, in for a pound.' }
];

function TopBarQuote() {
  const [quote, setQuote] = useState(germanQuotes[0]);
  const [showTranslation, setShowTranslation] = useState(false);
  const getRandomQuote = () => {
    let newQuote;
    do {
      newQuote = germanQuotes[Math.floor(Math.random() * germanQuotes.length)];
    } while (newQuote === quote && germanQuotes.length > 1);
    setQuote(newQuote);
    setShowTranslation(false);
  };
  return (
    <div className="flex flex-col items-center justify-center mx-auto max-w-xl 
    px-4 select-none hover:scale-105 cursor-pointer
    ">
      <div className="flex items-center gap-2 mb-1 rounded-3xl shadow-lg p-3">
        <button
          onClick={getRandomQuote}
          className="rounded-full bg-orange-400 hover:bg-orange-500 hover:scale-105 cursor-pointer text-white w-8 h-8 flex items-center justify-center shadow transition"
          title="New Quote"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <span className="text-base md:text-lg font-semibold text-gray-700 dark:text-white italic">"{quote.q}"</span>
      </div>
    </div>
  );
}

export default function TopBar() {
  const { user } = useAuth();
  const level = user?.level ?? 1;
  const streak = user?.streak ?? 0;
  return (
    <header className="w-full flex items-center justify-between z-20 dark:text-white transition-colors duration-300">
      <Logo />
      <TopBarQuote />
      <ProfileAndStats level={level} streak={streak} />
    </header>
  );
}
