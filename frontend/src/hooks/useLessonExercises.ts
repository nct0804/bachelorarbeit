// src/hooks/useLessonExercises.ts
import { useEffect, useState } from "react"

export interface ExerciseOption {
  id: number
  text: string
  order: number
  imageSrc?: string | null
  audioSrc?: string | null
}

export interface Exercise {
  id: number
  lessonId: number
  type: "MULTIPLE_CHOICE" | "FILL_IN_BLANK" | "VOCABULARY_CHECK"
  question: string
  instruction: string
  order: number
  xpReward: number
  timeLimit: number
  exerciseOptions: ExerciseOption[]
}

export function useLessonExercises(lessonId: number) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<null | Error>(null)

  useEffect(() => {
    if (!lessonId) return
    setLoading(true)
    fetch(`http://localhost:3000/api/exercises/lesson/${lessonId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!json.success) throw new Error("API returned success=false")
        setExercises(json.data)
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false))
  }, [lessonId])

  return { exercises, loading, error }
}
