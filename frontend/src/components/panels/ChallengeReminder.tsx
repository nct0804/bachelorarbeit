import { useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";

export default function ChallengeReminder({ loading = false }: { loading?: boolean }) {
  const navigate = useNavigate();

  // Show skeleton loader while loading
  if (loading) {
    return (
      <div
        className="
          relative 
          bg-white dark:bg-gradient-to-br dark:from-[#174a6a] dark:via-[#256996] dark:to-[#3B6978] 
          rounded-3xl shadow-lg flex flex-col items-center 
          px-3 py-3
          h-[300px] animate-pulse
        "
      >
        {/* Skeleton icon */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2">
          <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-600"></div>
        </div>

        {/* Skeleton content */}
        <div className="mt-[70px] flex flex-col items-center w-full text-center">
          <div className="w-16 h-3 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
          <div className="w-24 h-5 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
          <div className="w-32 h-3 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
        </div>

        {/* Skeleton button */}
        <div className="mt-auto w-28 h-8 bg-gray-200 dark:bg-gray-600 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div
      className="
        relative 
        bg-white dark:bg-gradient-to-br dark:from-[#174a6a] dark:via-[#256996] dark:to-[#3B6978] 
        rounded-3xl shadow-lg flex flex-col items-center 
        px-3 py-3
        h-[300px]  /* fix size to match LessonReminder */
      "
    >
      {/* 1. Absolute‐positioned icon */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50">
          <Trophy className="w-10 h-10 text-yellow-500" />
        </div>
      </div>

      {/* 2. Content sits below the icon */}
      <div className="mt-[70px] flex flex-col items-center w-full text-center">
        <span className="text-xs uppercase font-bold text-yellow-500 tracking-wider mb-1">
          Challenge
        </span>
        <div className="font-semibold text-lg text-[#256996] dark:text-white mb-1">
          Vocabulary
        </div>
        <div className="text-gray-600 dark:text-gray-200 text-sm mb-2 px-2">
          Complete today's challenge to earn bonus XP!
        </div>
      </div>

      {/* 3. Button always at bottom */}
      <button
        onClick={() => navigate("/challenge")}
        className="
          mt-auto 
          px-4 py-2 
          bg-gradient-to-r from-[#05315B] via-[#256996] to-[#3B6978] 
          hover:from-[#042743] hover:to-[#174a6a] 
          text-white font-semibold 
          rounded-xl shadow-lg transition active:scale-95
          w-max
        "
      >
        Start Challenge
      </button>
    </div>
  );
}
