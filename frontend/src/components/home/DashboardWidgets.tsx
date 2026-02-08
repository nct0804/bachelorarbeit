import { useState } from 'react';
import DailyGoalCard from './DailyGoalCard';
import WordOfDayCard from './WordOfDayCard';
import QuickPracticeCard from './QuickPracticeCard';
import FocusTimerCard from './FocusTimerCard';

export default function DashboardWidgets() {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey((v) => v + 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6" data-test="home-dashboard">
      <DailyGoalCard refreshKey={refreshKey} />
      <WordOfDayCard refreshKey={refreshKey} />
      <QuickPracticeCard onComplete={triggerRefresh} />
      <FocusTimerCard onComplete={triggerRefresh} />
    </div>
  );
}
