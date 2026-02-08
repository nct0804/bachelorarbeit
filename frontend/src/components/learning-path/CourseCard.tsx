import type { CourseProgress } from "@/components/types/courseProgress"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LockIcon, Play, Star } from "lucide-react"

interface CourseCardProps {
  course: CourseProgress
  icon: string
  isLocked: boolean
  isCompleted: boolean
  onClick: () => void
}

export default function CourseCard({ course, icon, onClick }: CourseCardProps) {
  const isLocked = course.completedLessons == course.totalLessons
  const isCompleted = course.isCompleted
  const number = 6
  // Calculate progress percentage based on lessons
  const progressPercent = course.totalModules > 0 ? Math.round((course.completedLessons / course.totalLessons) * 100) : 0;

  // Get lesson titles from all modules for hints
  const lessonTitles = course.modules
    .flatMap(module => module.lessons)
    .slice(0, number) // Show first 4 lessons as hints
    .map(lesson => lesson.title);

  return (

    <Card
      className={`p-0 relative border-none shadow-sm transition-colors duration-300
    ${!isLocked ? '  dark:bg-gray-700/50' : 'dark:bg-gray-800'}`}
      data-test={`course-card-${course.id}`}
    >

      <CardContent className="flex flex-col gap-2 py-8 relative z-20" data-test="course-card-content">
        {/* Top row: icon + content */}
        <div className="flex flex-row items-center gap-6 w-full " data-test="course-card-main">
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-24" data-test="course-card-icon">
            <img
              src={icon}
              alt={`${course.title} icon`}
              className="w-24 h-24 rounded-xl bg-[#FFFBF3] dark:bg-gray-600 p-2 transition-colors duration-300"
            />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold dark:text-white transition-colors duration-300" data-test="course-card-title">{course.title}</CardTitle>
            <CardDescription className="text-base text-black dark:text-gray-300 transition-colors duration-300" data-test="course-card-description">{course.description}</CardDescription>
            
            {/* Lesson hints section */}
            {lessonTitles.length > 0 && (
              <div className="mt-3" data-test="course-card-lessons">
                <p className="text-xs font-medium mb-2 dark:text-gray-300 transition-colors duration-300" data-test="course-card-lessons-label">You'll learn:</p>
                <div className="flex flex-wrap gap-1" data-test="course-card-lessons-list">
                  {lessonTitles.map((title, index) => (
                    <span
                      key={index}
                      data-test="course-card-lesson-chip"
                      className="inline-block px-2 py-1 text-xs bg-[#FBFBFC] dark:bg-gray-600 text-[#408297] dark:text-blue-400 rounded-md border border-blue-100 dark:border-gray-500 transition-colors duration-300"
                    >
                      {title}
                    </span>
                  ))}
                  {course.totalLessons > number && (
                    <span className="inline-block px-2 py-1 text-xs bg-white dark:bg-gray-600 text-[#408297] dark:text-blue-400 rounded-md transition-colors duration-300" data-test="course-card-lesson-more">
                      +{course.totalLessons - number} more
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden transition-colors duration-300" data-test="course-card-progress">
              <div
                className="h-full bg-[#FDBA17] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-300" data-test="course-card-progress-text">
              {progressPercent}%
            </div>
          </div>
        </div>
        {/* Button row: right aligned */}
        <div className="flex flex-row justify-end w-full mt-2" data-test="course-card-actions">
          <Button
            onClick={isLocked ? undefined : onClick}
            disabled={isLocked}
            data-test={`course-card-action-${course.id}`}
            className={`px-5 py-2 rounded-full font-bold transition cursor-pointer ${
              isLocked
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : isCompleted
                ? "bg-[#408297] hover:bg-[#408297] text-white"
                : "bg-[#256996] hover:bg-[#ffd66e] text-white"
            }`}
            variant="default"
            size="lg"
          >
            {isLocked ? "LOCKED" : course.actionLabel}
            {isLocked && <LockIcon className="w-5 h-5" />}
            {!isLocked && !course.isCompleted && <Star className="w-5 h-5" />}
            {!isLocked && course.isCompleted && <Play className="w-5 h-5" />} 
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
