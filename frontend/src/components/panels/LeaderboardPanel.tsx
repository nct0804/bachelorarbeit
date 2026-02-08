import FirstIcon from '../../assets/1st.png';
import SecondIcon from '../../assets/2nd.png';
import ThirdIcon from '../../assets/3rd.png';
import useLeaderboard from '../../hooks/useLeaderboard.ts';

const rankIcons = [FirstIcon, SecondIcon, ThirdIcon];

export default function LeaderboardPanel() {
  const { users, loading, error } = useLeaderboard(3);

  const content = () => {
    if (loading) return console.log("LeaderboardPanel Loading...");
    if (error) return console.log("Failed to load leaderboard");

    return users.slice(0, 3).map((user, idx) => (
      <div
        key={user.id}
        className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 shadow-sm transition-colors duration-300"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-600 mr-2 transition-colors duration-300">
          <img src={rankIcons[idx]} alt={`${idx + 1} place`} className="w-14 h-14 object-contain" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-800 dark:text-white text-base transition-colors duration-300">
            {(user.firstName || user.lastName)
              ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
              : user.username}
          </div>
          <div className="text-sm text-blue-500 dark:text-blue-400 font-medium transition-colors duration-300">
            {user.xp.toLocaleString()} XP
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border-none shadow-lg transition-colors duration-300">
      <div className="font-semibold text-xl mb-4 text-gray-800 dark:text-white transition-colors duration-300">Leaderboard</div>
      <div className="flex flex-col gap-3">{content()}</div>
    </div>
  );
}
