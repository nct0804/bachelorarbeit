import React from 'react';
import '../style/LeaderRanking.css';
import { useAuth } from '../hooks/useAuth.tsx';
import useLeaderboard from '../hooks/useLeaderboard.ts';

interface RankingMedalProps {
  rank: 1 | 2 | 3;
  size?: number;
}

const RankingMedal: React.FC<RankingMedalProps> = ({ rank, size = 40 }) => {
  const getMedalConfig = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          medalColor: '#FFD700',
          ribbonColor: '#FFA500',
          textColor: '#8B6914',
          borderColor: '#B8860B'
        };
      case 2:
        return {
          medalColor: '#C0C0C0',
          ribbonColor: '#A0A0A0',
          textColor: '#555555',
          borderColor: '#808080'
        };
      case 3:
        return {
          medalColor: '#CD7F32',
          ribbonColor: '#A0522D',
          textColor: '#5D4E37',
          borderColor: '#8B4513'
        };
      default:
        return {
          medalColor: '#E0E0E0',
          ribbonColor: '#CCCCCC',
          textColor: '#666666',
          borderColor: '#AAAAAA'
        };
    }
  };

  const config = getMedalConfig(rank);

  return (
    <div 
      className="ranking-medal"
      style={{
        width: size,
        height: size * 1.3,
        position: 'relative',
        display: 'inline-block'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: size * 0.4,
          height: size * 0.6,
          background: `linear-gradient(45deg, ${config.ribbonColor}, ${config.ribbonColor}DD)`,
          clipPath: 'polygon(0 0, 100% 0, 85% 100%, 50% 80%, 15% 100%)',
          zIndex: 1
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: size * 0.3,
          left: '50%',
          transform: 'translateX(-50%)',
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${config.medalColor}, ${config.medalColor}CC)`,
          border: `2px solid ${config.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)`,
          zIndex: 2
        }}
      >
        <span
          style={{
            fontSize: size * 0.35,
            fontWeight: 'bold',
            color: config.textColor,
            textShadow: rank <= 3 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
          }}
        >
          {rank}
        </span>
      </div>

      {rank === 1 && (
        <div
          style={{
            position: 'absolute',
            top: size * 0.35,
            left: '58%',
            transform: 'translateX(-50%)',
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
            zIndex: 3
          }}
        />
      )}
    </div>
  );
};

export default function Ranking() {
  const { user } = useAuth();
  const { users, loading } = useLeaderboard(20);

  const rankingData = users.map((u, idx) => {
    const name = u.firstName || u.lastName ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : u.username;
    const isCurrentUser = user?.id === u.id;
    return {
      rank: idx + 1,
      name: name || u.username,
      level: u.level,
      xp: u.xp,
      avatar: (u.username || '?')[0].toUpperCase(),
      bgColor: isCurrentUser ? 'from-orange-400 to-orange-500' : 'from-blue-400 to-purple-500',
      isCurrentUser,
    };
  });

  const getRankingItemClass = (rank: number, isCurrentUser?: boolean) => {
    const baseClass = "ranking-item flex items-center p-3 rounded-lg";
    
    if (isCurrentUser) {
      return `${baseClass} current-user-bg`;
    }
    
    switch (rank) {
      case 1: return `${baseClass} rank-1-bg`;
      case 2: return `${baseClass} rank-2-bg`;
      case 3: return `${baseClass} rank-3-bg`;
      default: return `${baseClass} bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors duration-300`;
    }
  };

  // Determine how many users to show based on screen width
  const [maxUsers, setMaxUsers] = React.useState(10);
  const [maxHeight, setMaxHeight] = React.useState('500px');
  React.useEffect(() => {
    const updateMaxUsers = () => {
      if (window.innerWidth >= 1920) {
        setMaxUsers(20);
        setMaxHeight('500px'); // Luôn giữ khung gọn, chỉ tăng số lượng user, không tăng chiều cao
      } else {
        setMaxUsers(10);
        setMaxHeight('500px');
      }
    };
    updateMaxUsers();
    window.addEventListener('resize', updateMaxUsers);
    return () => window.removeEventListener('resize', updateMaxUsers);
  }, []);

  return (
    <div className="flex-1 flex justify-center overflow-auto max-w-3xl 2xl:max-w-4xl 3xl:max-w-6xl mx-auto leaderboard-container" data-test="page-ranking">
      <div className="w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300" data-test="ranking-card">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 transition-colors duration-300">Leaderboard</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors duration-300">Compete with others and climb to the top!</p>
          </div>

          <div className="flex justify-center gap-2 mb-6" data-test="ranking-tabs">
            <button className="tab-button px-5 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full font-medium text-sm shadow-md active" data-test="ranking-tab-week">
              This Week
            </button>
            <button className="tab-button px-5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" data-test="ranking-tab-month">
              This Month
            </button>
            <button className="tab-button px-5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" data-test="ranking-tab-all">
              All Time
            </button>
          </div>

          <div className="ranking-list space-y-3 overflow-y-auto" style={{ maxHeight }} data-test="ranking-list">
            {loading ? (
              <div className="text-center" data-test="ranking-loading">Loading...</div>
            ) : (
              rankingData.slice(0, maxUsers).map((user) => (
                <div
                  key={user.rank}
                  className={getRankingItemClass(user.rank, user.isCurrentUser)}
                  data-test={`ranking-item-${user.rank}`}
                >

                  <div className="rank-container mr-4">
                    {user.rank <= 3 ? (
                      <RankingMedal rank={user.rank as 1 | 2 | 3} size={50} />
                    ) : (
                      <div className="rank-number-plain">
                        {user.rank}
                      </div>
                    )}
                  </div>

                  <div className={`user-avatar bg-gradient-to-br ${user.bgColor} mr-5`}>
                    {user.avatar}
                  </div>

                  <div className="user-info">
                    <div className="user-name text-2xl font-bold">{user.name}</div>
                    <div className="user-level text-xl font-semibold">Level {user.level}</div>
                  </div>

                  <div className="xp-display">
                    <div className="xp-value text-base font-bold">{user.xp.toLocaleString()}</div>
                    <div className="xp-label text-base">XP</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
