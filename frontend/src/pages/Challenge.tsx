import { useState } from 'react';
import trophy from '../assets/trophy.png';
import star from '../assets/star.png';
import heart from '../assets/heart.png';
import XP1 from '../assets/XP-1.png';
import XP2 from '../assets/XP-2.png';
import streak from '../assets/streak.png';
import chest from '../assets/chest.png';
import { useAuth } from '../hooks/useAuth';

interface ChallengeCard {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Vocabulary' | 'Listening' | 'Speaking' | 'Numbers' | 'Grammar';
  icon: string;
  progress: number;
  isLocked: boolean;
  isCompleted: boolean;
}

const challenges: ChallengeCard[] = [
  {
    id: 'vocab-master',
    title: 'Vocabulary Master',
    description: 'Master essential German vocabulary through interactive exercises',
    xpReward: 50,
    difficulty: 'Beginner',
    category: 'Vocabulary',
    icon: '📚',
    progress: 75,
    isLocked: false,
    isCompleted: false
  },
  {
    id: 'listening-champion',
    title: 'Listening Champion',
    description: 'Train your ear with authentic German pronunciation',
    xpReward: 75,
    difficulty: 'Intermediate',
    category: 'Listening',
    icon: '🎧',
    progress: 45,
    isLocked: false,
    isCompleted: false
  },
  {
    id: 'speaking-pro',
    title: 'Speaking Pro',
    description: 'Practice pronunciation and build confidence in speaking',
    xpReward: 100,
    difficulty: 'Advanced',
    category: 'Speaking',
    icon: '🗣️',
    progress: 20,
    isLocked: false,
    isCompleted: false
  },
  {
    id: 'number-ninja',
    title: 'Number Ninja',
    description: 'Master German numbers and counting systems',
    xpReward: 40,
    difficulty: 'Beginner',
    category: 'Numbers',
    icon: '🔢',
    progress: 90,
    isLocked: false,
    isCompleted: false
  },
  {
    id: 'grammar-guru',
    title: 'Grammar Guru',
    description: 'Conquer German grammar rules and sentence structure',
    xpReward: 80,
    difficulty: 'Advanced',
    category: 'Grammar',
    icon: '📝',
    progress: 0,
    isLocked: true,
    isCompleted: false
  },
  {
    id: 'daily-challenge',
    title: 'Daily Challenge',
    description: 'Complete today\'s special challenge for bonus rewards',
    xpReward: 25,
    difficulty: 'Beginner',
    category: 'Vocabulary',
    icon: '⭐',
    progress: 100,
    isLocked: false,
    isCompleted: true
  }
];

const difficultyColors = {
  Beginner: 'bg-green-100 text-green-800 border-green-200',
  Intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Advanced: 'bg-red-100 text-red-800 border-red-200'
};

const categoryColors = {
  Vocabulary: 'from-blue-400 to-blue-500',
  Listening: 'from-purple-400 to-purple-500',
  Speaking: 'from-green-400 to-green-500',
  Numbers: 'from-orange-400 to-orange-500',
  Grammar: 'from-red-400 to-red-500'
};

export default function Challenge() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { user } = useAuth();
  
  // Use real data from database
  const userStats = {
    totalXP: user?.xp ?? 0,
    level: user?.level ?? 1,
    streak: user?.streak ?? 0,
    challengesCompleted: 1, // Hardcoded for now
    totalChallenges: 30 // Hardcoded for now
  };

  const filteredChallenges = selectedCategory === 'All' 
    ? challenges 
    : challenges.filter(challenge => challenge.category === selectedCategory);

  const categories = ['All', ...Array.from(new Set(challenges.map(c => c.category)))];

      return (
      <div
        className="max-w-3xl 2xl:max-w-4xl 3xl:max-w-6xl mx-auto overflow-auto min-h-screen dark:bg-gray-800 bg-gradient-to-br bg-white transition rounded-3xl"
        data-test="page-challenge"
      > 
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#05315B] via-[#256996] to-[#3B6978] text-white px-4 py-8" data-test="challenge-hero">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <img src={trophy} alt="Trophy" className="w-16 h-16 mr-4 animate-bounce" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Challenge Center
              </h1>
            </div>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              Level up your German skills with exciting challenges. Earn XP, unlock achievements, and track your progress!
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto" data-test="challenge-stats">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20" data-test="challenge-stat-xp">
                <div className="flex items-center justify-center mb-2">
                  <img src={XP1} alt="XP" className="w-6 h-6 mr-2" />
                  <span className="text-2xl font-bold">{userStats.totalXP}</span>
                </div>
                <p className="text-sm text-blue-100">Total XP</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20" data-test="challenge-stat-level">
                <div className="flex items-center justify-center mb-2">
                  <img src={star} alt="Level" className="w-6 h-6 mr-2" />
                  <span className="text-2xl font-bold">{userStats.level}</span>
                </div>
                <p className="text-sm text-blue-100">Level</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20" data-test="challenge-stat-streak">
                <div className="flex items-center justify-center mb-2">
                  <img src={streak} alt="Streak" className="w-6 h-6 mr-2" />
                  <span className="text-2xl font-bold">{userStats.streak}</span>
                </div>
                <p className="text-sm text-blue-100">Day Streak</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20" data-test="challenge-stat-completed">
                <div className="flex items-center justify-center mb-2">
                  <img src={chest} alt="Completed" className="w-6 h-6 mr-2" />
                  <span className="text-2xl font-bold">{userStats.challengesCompleted}/{userStats.totalChallenges}</span>
                </div>
                <p className="text-sm text-blue-100">Completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8" data-test="challenge-content">
        {/* Category Filter */}
        <div className="mb-8" data-test="challenge-category-filter">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                data-test={`challenge-category-${category.toLowerCase()}`}
                className={`px-4 py-3 rounded-full font-semibold transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-[#256996] text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-test="challenge-grid">
          {filteredChallenges.map((challenge) => (
            <div
              key={challenge.id}
              data-test={`challenge-card-${challenge.id}`}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col h-full ${
                challenge.isLocked ? 'opacity-60' : ''
              }`}
            >
              {/* Header with gradient */}
              <div className={`h-32 bg-gradient-to-r ${categoryColors[challenge.category]} relative overflow-hidden flex items-center`} data-test={`challenge-card-header-${challenge.id}`}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative p-6 w-full flex items-center justify-between">
                  <div className="text-4xl">{challenge.icon}</div>
                  <div className="text-right">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-bold">
                      +{challenge.xpReward} XP
                    </div>
                    {challenge.isCompleted && (
                      <div className="mt-2 bg-yellow-400 rounded-full p-1">
                        <img src={star} alt="Completed" className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-6">
                <div className="flex items-start justify-between mb-3" data-test={`challenge-card-title-${challenge.id}`}>
                  <h3 className="text-xl font-bold text-gray-900">{challenge.title}</h3>
                  {challenge.isLocked && (
                    <div className="bg-gray-200 rounded-full p-1">
                      <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{challenge.description}</p>
                
                <div className="flex items-center justify-between mb-4" data-test={`challenge-card-meta-${challenge.id}`}>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${difficultyColors[challenge.difficulty]}`}> 
                    {challenge.difficulty}
                  </span>
                  <span className="text-sm text-gray-500">{challenge.category}</span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4" data-test={`challenge-card-progress-${challenge.id}`}>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{challenge.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        challenge.progress === 100 
                          ? 'bg-green-500' 
                          : challenge.progress > 50 
                          ? 'bg-blue-500' 
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${challenge.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  disabled={challenge.isLocked}
                  data-test={`challenge-card-action-${challenge.id}`}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 mt-auto ${
                    challenge.isLocked
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : challenge.isCompleted
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : `bg-gradient-to-r ${categoryColors[challenge.category]} text-white hover:shadow-lg hover:scale-105`
                  }`}
                >
                  {challenge.isLocked ? 'Locked' : challenge.isCompleted ? 'Completed ✓' : 'Start Challenge'}
                </button>
                
              </div>

              {/* Completion Badge */}
              {/* {challenge.isCompleted && (
                <div className="absolute top-4 right-4 bg-yellow-400 rounded-full p-2 shadow-lg">
                  <img src={star} alt="Completed" className="w-4 h-4" />
                </div>
              )} */}
            </div>
          ))}
        </div>

        {/* Achievement Section */}
        {/* <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Recent Achievements</h2>
            <p className="text-gray-600">Celebrate your learning milestones!</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src={trophy} alt="Achievement" className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Vocabulary Master</h3>
              <p className="text-gray-600 text-sm">Completed 50 vocabulary challenges</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src={streak} alt="Streak" className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Consistency King</h3>
              <p className="text-gray-600 text-sm">Maintained a 10-day learning streak</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="w-16 h-16 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src={heart} alt="Heart" className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Perfect Score</h3>
              <p className="text-gray-600 text-sm">Achieved 100% on 5 challenges</p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
