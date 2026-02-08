import QuotePanel from "../panels/QuotePanel";
import LeaderboardPanel from "../panels/LeaderboardPanel";
import LessonReminder from "../panels/LessonReminder";
import ChallengeReminder from "../panels/ChallengeReminder";


export default function RightBar({ 
  nextLesson, 
  loading = false 
}: { 
  nextLesson?: { id: number, title: string, description?: string } | null;
  loading?: boolean;
}) {
  return (
    <aside className="w-[30%] w-[400px] rounded-3xl transition-colors duration-300">
      <LeaderboardPanel />
      <div className="grid grid-cols-2 gap-4 mt-5">
        <LessonReminder lesson={nextLesson || null} loading={loading} />
        <ChallengeReminder loading={loading} />  
      </div>
      {/* <QuotePanel /> */}

    </aside>
  )
}
