import { useEffect, useState } from "react";

export interface LessonModuleProgress {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  order: number;
  xpReward: number;
  estimatedTime: number;
  createdAt: string;
  _count: {
    exercises: number;
  };
  progress: number;
  completedExercises: number;
  totalExercises: number;
  isCompleted: boolean;
  isLocked: boolean;
  status: string;
  actionLabel: string;
  isLearned: boolean;
}

export function useLessonModuleProgress(moduleId: number) {
  const [lessons, setLessons] = useState<LessonModuleProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | Error>(null);

  useEffect(() => {
    if (!moduleId) return;
    setLoading(true);
    fetch(`http://localhost:3000/api/lesson/module/${moduleId}/progress`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.success) throw new Error("API returned success=false");
        setLessons(json.data);
      })
      .catch((err) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [moduleId]);

  return { lessons, loading, error };
} 

export function useAllModulesLessonProgress(moduleIds: number[]) {
    const [data, setData] = useState<Record<number, LessonModuleProgress[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<null | Error>(null);
  
    useEffect(() => {
      if (!moduleIds.length) return;
      setLoading(true);
      setError(null);
  
      Promise.all(
        moduleIds.map(moduleId =>
          fetch(`http://localhost:3000/api/lesson/module/${moduleId}/progress`, {
            credentials: "include",
          })
            .then(async res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const json = await res.json();
              if (!json.success) throw new Error("API returned success=false");
              return { moduleId, lessons: json.data as LessonModuleProgress[] };
            })
        )
      )
        .then(results => {
          const resultMap: Record<number, LessonModuleProgress[]> = {};
          results.forEach(({ moduleId, lessons }) => {
            resultMap[moduleId] = lessons;
          });
          setData(resultMap);
        })
        .catch(err => setError(err instanceof Error ? err : new Error(String(err))))
        .finally(() => setLoading(false));
    }, [moduleIds.join(",")]); // join to avoid effect not firing on array identity change
  
    return { data, loading, error };
  } 