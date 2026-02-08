import { useState, useMemo } from "react";
import LessonHeader from "../learning-path/LessonHeader";
import VerticalStep from "../learning-path/VerticalStep";
import CourseCard from "../learning-path/CourseCard"
import useCoursesWithProgress from "../../hooks/useCoursesWithProgress";
import { useAllModulesLessonProgress } from "../../hooks/useLessonModuleProgress";

import GreetingIcon from "../../assets/greeting.png";
import NumberIcon from "../../assets/numbers.png";
import EveryDayPhrasesIcon from "../../assets/everydayphrases.png"
import OrdinalNumberIcon from "../../assets/ordinalnumber.png"
import QuestionIcon from "../../assets/question.png"
import IntroductionIcon from "../../assets/introduce-yourself.png"
import FormalVsInformalIcon from "../../assets/speech.png"
import Number1120Icon from "../../assets/Number12.png"
import Number100Icon from "../../assets/number100.png"
import AgeIcon from "../../assets/age.png"
import A11 from "../../assets/course_19.png"
import A12 from "../../assets/course_5.png"
import A21 from "../../assets/course_17.png"
import A22 from "../../assets/course_21.png"
import Course1Icon from '../../assets/course_1.png';
import DashboardWidgets from '../home/DashboardWidgets';

const moduleIcons = [
  A11,  // German A1.1
  A12,  // German A1.2
  A21,  // German A2.1
  A22   // German A2.2
]

const lessonIconMap: Record<number, string> = {
  1: IntroductionIcon,          // Introducing Yourself
  2: EveryDayPhrasesIcon,       // Common Everyday Phrases
  3: GreetingIcon,              // Basic Greeting
  4: FormalVsInformalIcon,      // Formal vs Informal Speech
  5: QuestionIcon,              // Asking Simple Questions
  6: Number1120Icon,            // Number 11-20
  7: OrdinalNumberIcon,         // Ordinal Number
  8: NumberIcon,                // Numbers 1-10
  9: AgeIcon,                   // Talking about age
  10: Number100Icon             // Number 21-100
};

// Helper for circular progress
function CircleProgress({ percent }: { percent: number }) {
  const radius = 60;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  return (
    <svg height={radius * 2} width={radius * 2} className="block">
      <circle
        stroke="#fff"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke="#38bdf8"
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        className="transition-all duration-500"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.3em"
        fontSize="1.3rem"
        className="fill-white font-bold"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

export default function MainContent() {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null)
  const { courses, loading, error } = useCoursesWithProgress()

  if (loading) console.log("Loading courses…")
  if (error)   console.log(error.message)

  const current = selectedCourse
    ? courses.find((c) => c.id === selectedCourse) ?? null
    : null

  // Memoize module IDs to avoid unnecessary renders
  const moduleIds = useMemo(() => current ? current.modules.map(m => m.id) : [], [current]);

  // Fetch lessons for all modules in the selected course
  const { data: lessonsByModule, loading: lessonsLoading, error: lessonsError } = useAllModulesLessonProgress(moduleIds);

  return (
    <div className="flex-1 flex flex-col items-center mx-auto bg-blue-50 rounded-3xl dark:bg-gray-800 max-w-3xl 2xl:max-w-4xl" data-test="page-home">
      {/* Hero Section: only show when no course is selected */}
      {!current && (
        <div className="w-full mb-8 sticky top-0 z-40" data-test="home-hero">
          <div className="bg-gradient-to-r from-[#ffa600] via-[#ffa600] to-[#FFB124] rounded-3xl 
          shadow-lg px-8 py-8 flex flex-col md:flex-row items-center md:items-center text-center 
          md:text-left gap-8 overflow-hidden dark:bg-gradient-to-b dark:from-[#05315B] 
          dark:via-[#256996] dark:to-[#3B6978] dark:text-white">
            <div className="flex flex-col items-center justify-center md:items-start 
            md:justify-start flex-1 z-10">
              {/* <img src={Course1Icon} alt="Learning Path" className="scale-130 mb-4" /> */}
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 drop-shadow">Your Learning Path</h1>
              <p className="text-lg text-white max-w-2xl mx-auto mb-2">Advance step by step through expertly designed German courses. Unlock new skills, earn XP, and celebrate your progress!</p>
            </div>
            {/* Circle Progress */}
            <div className="flex flex-col items-center justify-center z-10">
              {/* Calculate progress */}
              {(() => {
                let totalLessons = 0;
                let learnedLessons = 0;
                courses.forEach(course => {
                  totalLessons += course.totalLessons || 0;
                  learnedLessons += course.completedLessons || 0;
                });
                const percent = totalLessons > 0 ? (learnedLessons / totalLessons) * 100 : 0;
                return (
                  <>
                    <CircleProgress percent={percent} />
                    <span className="mt-2 text-white font-semibold text-sm">Lessons Learned</span>
                    <span className="text-blue-100 text-xs">{learnedLessons} / {totalLessons}</span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
        <div className="w-full rounded-3xl shadow-lg dark:bg-gray-800 transition-colors duration-300 h-full" data-test="home-content">
        {!current ? (
          <>
            <div className="px-4 sm:px-6" data-test="home-dashboard-wrap">
              <DashboardWidgets />
            </div>
            
            <div className="space-y-3" data-test="home-course-list">
              {courses.map((course, idx) => (
                <div
                  key={course.id}
                  className="rounded-2xl transition-all duration-200 border-2 
                  border-transparent hover:border-blue-400"
                  data-test={`home-course-card-${course.id}`}
                >
                  <CourseCard
                    course={course}
                    icon={moduleIcons[idx]}
                    onClick={() => setSelectedCourse(course.id)}
                    isLocked={course.status !== "learn"}
                    isCompleted={course.isCompleted}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          current.modules.map((module) => {
            const lessons = lessonsByModule[module.id] || [];
            return (
              <div key={module.id} data-test={`home-module-${module.id}`}>
                {/* {module.isLocked ? (
                  // Show a hint for the next lesson (first lesson in the module)
                  lessons.length > 0 && lessons[0].title ? (
                    <div className="flex items-center w-full my-8">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="mx-4 text-gray-500 italic whitespace-nowrap">Next up: {lessons[0].title}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  ) : null
                ) : ( */}
                  <LessonHeader
                    id={module.id}
                    title={module.title}
                    description={module.description}
                    setSelectedLesson={() => setSelectedCourse(null)}
                    isLocked={module.isLocked}
                    order={module.order}
                  />
                {lessonsLoading ? (
                  (console.log('Loading lessons...'), null)
                ) : lessonsError ? (  
                  (console.log('Error loading lessons: ', lessonsError.message), null)
                ) : (
                  <VerticalStep
                    steps={lessons.map((lesson) => ({
                      ...lesson,
                      icon: lessonIconMap[lesson.id],
                      order: lesson.order,
                      isLocked: module.isLocked,
                      lessonId: lesson.id,
                      onClick: () => {},
                      bubbleRef: null,
                      nodeWrapperRef: null,
                      blockedBubbleRef: null,
                      xpReward: lesson.xpReward.toString(),
                    }))}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  )
}
