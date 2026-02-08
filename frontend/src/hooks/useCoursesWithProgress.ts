import { useState, useEffect } from "react";
import type {
  CourseProgressResponse,
  CourseProgress,
} from "../components/types/courseProgress.ts";

export default function useCoursesWithProgress() {
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const CACHE_KEY = "gg_courses_cache_v1";
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  useEffect(() => {
    setLoading(true);

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { savedAt: number; data: CourseProgress[] };
        if (Date.now() - parsed.savedAt < CACHE_TTL_MS) {
          setCourses(parsed.data);
        }
      } catch {
        // ignore cache parse errors
      }
    }

    fetch(`http://localhost:3000/api/courses/progress/all`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as CourseProgressResponse;
        if (!json.success) throw new Error("API returned success=false");
        return json.data;
      })
      .then((data) => {
        // sort by order ascending
        data.sort((a, b) => a.order - b.order);
        // also sort each module & lesson inside
        data.forEach((course) => {
          course.modules.sort((m1, m2) => m1.order - m2.order);
          course.modules.forEach((mod) =>
            mod.lessons.sort((l1, l2) => l1.order - l2.order)
          );
        });
        setCourses(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data })); // defect: cache never invalidates on server updates within TTL
      })
      .catch((err) => {
        console.error("useCoursesWithProgress:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => setLoading(false));
  }, []);

  return { courses, loading, error };
}
