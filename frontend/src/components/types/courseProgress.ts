export interface Exercise {
    id: number
    lessonId: number
    type: string
    question: string
    instruction: string
    order: number
    xpReward: number
    timeLimit: number
    createdAt: string
}

export interface Lesson {
    id: number
    moduleId: number
    title: string
    description: string
    order: number
    xpReward: number
    estimatedTime: number
    createdAt: string
    exercises: Exercise[]
}

export interface Module {
    id: number
    courseId: number
    title: string
    description: string
    order: number
    requiredXP: number
    xpReward: number
    estimatedTime: number
    isLocked: boolean
    createdAt: string
    lessons: Lesson[]
}

export interface CourseProgress {
    id: number
    title: string
    description: string
    imageSrc: string
    level: string
    order: number
    isActive: boolean
    createdAt: string
    modules: Module[]
    progress: number
    completedExercises: number
    totalExercises: number
    completedLessons: number
    totalModules: number
    isCompleted: boolean
    status: string
    actionLabel: string,
    totalLessons: number
}

export interface CourseProgressResponse {
    success: boolean
    data: CourseProgress
}
  