import { useState } from "react"
import { useAuth } from "./useAuth.tsx"

export interface CheckResult {
  isCorrect: boolean
  xpReward: number
  baseXpReward: number
  streakMultiplier: number
  currentStreak: number
  levelUp: {
    leveledUp: boolean
    xpForNextLevel: number
  }
  correctAnswer: string
  feedback: string
  completionMessage: string | null
}

export function useExerciseCheck() {
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  useAuth();

  const checkExercise = async (exerciseId: number, answer: string | number) => {
    setChecking(true)
    setError(null)
    
    try {
      const response = await fetch(
        `http://localhost:3000/api/exercises/${exerciseId}/check`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            answer
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error("API returned success=false")
      }

      setCheckResult(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while checking the exercise'
      setError(errorMessage)
      
      // Set a default error result
      const defaultResult: CheckResult = {
        isCorrect: false,
        xpReward: 0,
        baseXpReward: 0,
        streakMultiplier: 1,
        currentStreak: 0,
        levelUp: {
          leveledUp: false,
          xpForNextLevel: 120
        },
        correctAnswer: '',
        feedback: 'An error occurred. Please try again.',
        completionMessage: null
      }
      
      setCheckResult(defaultResult)
      return defaultResult
    } finally {
      setChecking(false)
    }
  }

  const resetCheck = () => {
    setCheckResult(null)
    setError(null)
  }

  return {
    checkExercise,
    checkResult,
    checking,
    error,
    resetCheck
  }
} 