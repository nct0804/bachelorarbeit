// LessonReminder.tsx
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";

export default function LessonReminder({
  lesson,
  loading = false,
}: {
  lesson: { id: number; title: string; description?: string } | null;
  loading?: boolean;
}) {
  const navigate = useNavigate();

  // Show skeleton loader while loading
  if (loading) {
    return (
      <div
        className={`
          relative bg-white dark:bg-gradient-to-br dark:from-[#174a6a] dark:via-[#256996] dark:to-[#3B6978]
          rounded-3xl shadow-lg flex flex-col items-center px-3 py-3
          h-[300px] animate-pulse
        `}
      >
        {/* Skeleton icon */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2">
          <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-600"></div>
        </div>

        {/* Skeleton content */}
        <div className="mt-[70px] flex flex-col items-center w-full text-center">
          <div className="w-20 h-3 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
          <div className="w-32 h-5 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
          <div className="w-24 h-3 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
        </div>

        {/* Skeleton button */}
        <div className="mt-auto w-20 h-8 bg-gray-200 dark:bg-gray-600 rounded-xl"></div>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div
      className={`
        relative bg-white dark:bg-gradient-to-br dark:from-[#174a6a] dark:via-[#256996] dark:to-[#3B6978]
        rounded-3xl shadow-lg flex flex-col items-center px-3 py-3
        h-[300px]
      `}
    >
      {/* Absolute-positioned icon */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2">
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-yellow-100">
          <ClipboardList className="w-10 h-10 text-[#256996]" />
        </div>
      </div>

      {/* Content below icon */}
      <div className="mt-[70px] flex flex-col items-center w-full text-center">
        <span className="text-xs uppercase font-bold text-orange-500 tracking-wider mb-1">
          Next Lesson
        </span>
        <div className="font-semibold text-lg text-[#256996] dark:text-white mb-1">
          {lesson.title}
        </div>
        {lesson.description && (
          <div className="text-gray-600 dark:text-gray-200 text-sm mb-2 px-2">
            {lesson.description}
          </div>
        )}
      </div>

      {/* Button at bottom */}
      <button
        onClick={() =>
          navigate("/learn", { state: { lessonId: lesson.id } })
        }
        className={`
          mt-auto px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-400
          hover:from-orange-600 hover:to-orange-500 text-white font-semibold
          rounded-xl shadow-lg transition active:scale-95 w-max mx-auto
        `}
      >
        Learn
      </button>
    </div>
  );
}
