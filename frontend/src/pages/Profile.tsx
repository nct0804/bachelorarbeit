import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Trophy, Zap, Flame, Star, Award, Crown, Loader2, AlertCircle, Heart } from 'lucide-react';
import useUserProfile from '../hooks/useUserProfile';
import { getFavoriteWords, getPracticeTotals, getStreakDays, getWeeklyActivity } from '@/lib/localProgress';
import { getFavoriteEntries } from '@/lib/wordBank';

// interface UserProfile {
//   id: string;
//   email: string;
//   username: string;
//   firstName: string;
//   lastName: string;
//   level: number;
//   xp: number;
//   streak: number;
// }

const ProfilePage: React.FC = () => {
  const { userProfile, isLoading, error, refetch } = useUserProfile();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const onFocus = () => setRefreshKey((v) => v + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const getXpForNextLevel = (currentLevel: number) => {
    return currentLevel * 1000;
  };

  const getLevelProgress = (xp: number, level: number) => {
    const xpForCurrentLevel = (level - 1) * 1000;
    const xpForNextLevel = level * 1000;
    const currentLevelXp = xp - xpForCurrentLevel;
    const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
    return Math.max(0, Math.min(100, (currentLevelXp / xpNeededForLevel) * 100));
  };

  const getAvatarInitials = (firstName: string, lastName: string) => {
    const first = firstName || '';
    const last = lastName || '';
    const firstInitial = first.charAt(0) || '';
    const lastInitial = last.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || 'U';
  };

  const practiceTotals = useMemo(() => getPracticeTotals(), [refreshKey]);
  const weekly = useMemo(() => getWeeklyActivity(undefined, 7), [refreshKey]);
  const localStreak = useMemo(() => getStreakDays(), [refreshKey]);
  const favoriteEntries = useMemo(() => getFavoriteEntries(getFavoriteWords()), [refreshKey]);

  const achievements = useMemo(() => {
    if (!userProfile) return [];
    const level = userProfile.level || 1;
    const xp = userProfile.xp || 0;
    const lessons = practiceTotals.lessons;
    const minutes = practiceTotals.minutes;
    const favorites = favoriteEntries.length;
    const streak = Math.max(userProfile.streak || 0, localStreak);

    return [
      { id: 'first-lesson', title: 'First Lesson', desc: 'Complete your first lesson.', value: lessons, goal: 1, icon: Trophy },
      { id: 'steady-streak', title: 'Steady Streak', desc: 'Keep a 7-day streak.', value: streak, goal: 7, icon: Flame },
      { id: 'xp-collector', title: 'XP Collector', desc: 'Earn 500 XP.', value: xp, goal: 500, icon: Zap },
      { id: 'level-up', title: 'Rising Star', desc: 'Reach level 5.', value: level, goal: 5, icon: Star },
      { id: 'focus-master', title: 'Focus Master', desc: 'Log 60 study minutes.', value: minutes, goal: 60, icon: Award },
      { id: 'word-keeper', title: 'Word Keeper', desc: 'Save 5 favorite words.', value: favorites, goal: 5, icon: Crown },
    ].map((item) => ({
      ...item,
      progress: Math.min(100, (item.value / item.goal) * 100),
      isUnlocked: item.value >= item.goal,
    }));
  }, [favoriteEntries.length, localStreak, practiceTotals.lessons, practiceTotals.minutes, userProfile]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-3xl max-w-3xl 2xl:max-w-4xl 3xl:max-w-6xl mx-auto transition-colors duration-300" data-test="profile-loading">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 text-center transition-colors duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors duration-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-3xl max-w-xl mx-auto transition-colors duration-300" data-test="profile-error">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 text-center transition-colors duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <p className="text-red-600 dark:text-red-400 mb-4 text-sm transition-colors duration-300">{error}</p>
          <button 
            onClick={refetch}
            data-test="profile-retry"
            className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-2 rounded-full hover:from-orange-500 hover:to-red-600 transition-all duration-300 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-3xl max-w-xl mx-auto transition-colors duration-300" data-test="profile-empty">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 text-center transition-colors duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors duration-300">No profile data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex justify-center overflow-auto px-4" data-test="page-profile">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-4 border border-gray-100 dark:border-gray-700 transition-colors duration-300" data-test="profile-header-card">
          <div className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 h-20 relative">
            <div className="absolute -bottom-8 left-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {getAvatarInitials(userProfile.firstName, userProfile.lastName)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="pt-10 pb-4 px-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-1 transition-colors duration-300">
                  {userProfile.firstName || 'User'} {userProfile.lastName || ''}
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-300 mb-2 transition-colors duration-300">@{userProfile.username || 'user'}</p>
                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-3 transition-colors duration-300">
                  <Mail className="w-3 h-3 mr-2" />
                  <span className="text-xs">{userProfile.email || 'No email'}</span>
                </div>
              </div>
              
              <div className="flex items-center bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1.5 rounded-full shadow-md">
                <Crown className="w-4 h-4 mr-1" />
                <span className="text-xs font-bold">Level {userProfile.level || 1}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4" data-test="profile-stats">
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-3 border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300" data-test="profile-stat-xp">
            <div className="flex items-center mb-2">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-full mr-2 transition-colors duration-300">
                <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-800 dark:text-white transition-colors duration-300">Experience</h3>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400 transition-colors duration-300">{(userProfile.xp || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-1 transition-colors duration-300">
              <div 
                className="bg-gradient-to-r from-orange-400 to-red-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${getLevelProgress(userProfile.xp || 0, userProfile.level || 1)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
              {getXpForNextLevel(userProfile.level || 1) - (userProfile.xp || 0)} XP to next level
            </p>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-3 border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300" data-test="profile-stat-streak">
            <div className="flex items-center mb-2">
              <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full mr-2 transition-colors duration-300">
                <Flame className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-800 dark:text-white transition-colors duration-300">Streak</h3>
                <p className="text-lg font-bold text-red-600 dark:text-red-400 transition-colors duration-300">{userProfile.streak || 0}</p>
              </div>
            </div>
            <div className="flex items-center">
              {[...Array(7)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-3 h-3 rounded-full mr-1 ${
                    i < (userProfile.streak || 0) % 7 ? 'bg-red-400 dark:bg-red-600' : 'bg-gray-200 dark:bg-gray-600'
                  } transition-colors duration-300`}
                />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-3 border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-300" data-test="profile-stat-level">
            <div className="flex items-center mb-2">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-1.5 rounded-full mr-2 transition-colors duration-300">
                <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-800 dark:text-white transition-colors duration-300">Current Level</h3>
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400 transition-colors duration-300">{userProfile.level || 1}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className={`w-3 h-3 ${
                    i < (userProfile.level || 1) ? 'text-yellow-400 dark:text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-500'
                  } transition-colors duration-300`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4" data-test="profile-activity">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 transition-colors duration-300" data-test="profile-achievements">
            <div className="flex items-center mb-3">
              <Award className="w-5 h-5 text-orange-500 mr-2" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white transition-colors duration-300">Achievements</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={achievement.id}
                    className={`rounded-lg border p-3 transition-all duration-300 ${
                      achievement.isUnlocked
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          achievement.isUnlocked ? 'bg-green-500/20 text-green-600' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">{achievement.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{achievement.desc}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {Math.min(achievement.value, achievement.goal)}/{achievement.goal}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${achievement.isUnlocked ? 'bg-green-500' : 'bg-orange-400'}`}
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center mb-3">
              <Flame className="w-5 h-5 text-red-500 mr-2" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white transition-colors duration-300">Weekly Activity</h2>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-3">
              {weekly.map((day) => {
                const active = day.xp > 0 || day.minutes > 0 || day.words > 0;
                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.xp} XP, ${day.minutes} min`}
                    className={`h-7 rounded-md text-[10px] font-semibold flex items-center justify-center ${
                      active ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {day.date.slice(8)}
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>Total XP logged: {practiceTotals.xp}</p>
              <p>Total focus minutes: {practiceTotals.minutes}</p>
              <p>Lessons completed: {practiceTotals.lessons}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 transition-colors duration-300" data-test="profile-favorites">
          <div className="flex items-center mb-3">
            <Heart className="w-5 h-5 text-pink-500 mr-2" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-white transition-colors duration-300">Saved Words</h2>
          </div>
          {favoriteEntries.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Save words from the home dashboard to build your personal vocab list.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {favoriteEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-700"
                >
                  <p className="font-semibold text-gray-800 dark:text-white">{entry.word}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{entry.translation}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{entry.example}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
