import LeftBar from './LeftBar';
import TopBar from './TopBar';
import RightBar from '@/components/layout/RightBar';
import { Outlet } from 'react-router-dom';
import { MenuProvider } from './MenuContext';

import useCoursesWithProgress from "../../hooks/useCoursesWithProgress";
import { useAllModulesLessonProgress } from "../../hooks/useLessonModuleProgress";
import { useMemo } from "react";

export default function MainLayout() {
  const { courses, loading: coursesLoading } = useCoursesWithProgress();
  const moduleIds = useMemo(() => courses.flatMap(c => c.modules.map(m => m.id)), [courses]);
  const { data: lessonsByModule, loading: lessonsLoading } = useAllModulesLessonProgress(moduleIds);

  const nextLesson = useMemo(() => {
    for (const course of courses) {
      for (const module of course.modules) {
        if (module.isLocked) continue;
        const lessons = lessonsByModule?.[module.id] || [];
        for (const lesson of lessons) {
          if (!lesson.isLearned && !lesson.isLocked) {
            console.log(lesson.id + lesson.title + lesson.description)
            return {
              id: lesson.id,
              title: lesson.title,
              description: lesson.description
            };
          }
        }
      }
    }
    return null;
  }, [courses, lessonsByModule]);

  // Show loading state if either courses or lessons are still loading
  const isLoading = coursesLoading || lessonsLoading;

  return (
    <MenuProvider>
      <div className="flex flex-col h-screen px-8 py-4 bg-[#FBFBFC] dark:bg-gray-900 min-w-[1400px] transition-colors duration-300">
        <TopBar />
        <div className="flex flex-1 overflow-hidden h-full">
          <LeftBar />
          <div className="w-full mx-auto min-h-0 overflow-y-auto
            max-w-3xl xl:max-w-3xl 2xl:max-w-4xl">
            <Outlet />
          </div>
          <RightBar nextLesson={nextLesson} loading={isLoading} />
        </div>
      </div>
    </MenuProvider>
  );
}
