import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center justify-center rounded-lg p-3 transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-white/20 active:bg-white/30"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="w-8 h-8 flex items-center justify-center relative">
        <FontAwesomeIcon
          icon={isDark ? faSun : faMoon}
          className={`text-2xl transition-all duration-300 ${
            isDark ? 'text-yellow-300 rotate-0' : 'text-white -rotate-90'
          }`}
        />
        {isDark && (
          <div className="absolute inset-0 bg-yellow-300/20 rounded-full animate-pulse" />
        )}
      </div>
    </button>
  );
} 