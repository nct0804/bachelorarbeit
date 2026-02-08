import avatar from '../../assets/avatar.png';
import StreakIcon from '../../assets/streak.png';
import HeartIcon from '../../assets/heart.png';
import StarIcon from '../../assets/star.png';
import ProgressBar from './ProgressBar';
import BrezelIcon from '../../assets/brezel.png';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

export default function ProfileAndStats({ level, streak }: { level: number, streak: number}) {
  const { user } = useAuth();
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  
  const handleMouseEnter = (text: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.right + 10,
      y: rect.top + rect.height / 2
    });
    setTooltipText(text);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };
  
  return (
    <>
      <div className="max-w-2xl rounded-2xl flex flex-col
      md:flex-row justify-center items-center gap-4 md:gap-8 mb-5">
        {/* Stat Chips */}
        <div className="flex flex-col flex-1 gap-2">
          <div className="flex items-center gap-6 mb-1">
            <div 
              className="relative w-20 h-14 flex-shrink-0 flex gap-3 items-center justify-center 
               hover:scale-105 cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter('Current streak', e)}
              onMouseLeave={handleMouseLeave}
            >
              <img src={StreakIcon} alt="streak" className="w-7 h-7" />
              <span className="text-orange-500 font-bold text-sm">{streak}</span>
            </div>
            <div 
              className="relative w-20 h-14 flex-shrink-0 flex gap-3 items-center justify-center 
               hover:scale-105 cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter('Hearts left', e)}
              onMouseLeave={handleMouseLeave}
            >
              <img src={HeartIcon} alt="heart" className="w-7 h-7" />
              <span className="text-red-500 font-bold text-sm">{user?.hearts || 0}</span>
            </div>
            <div 
              className="relative w-20 h-14 flex-shrink-0 flex gap-3 items-center justify-center 
               hover:scale-105 cursor-pointer"
              onMouseEnter={(e) => handleMouseEnter('Brezel points', e)}
              onMouseLeave={handleMouseLeave}
            >
              <img src={BrezelIcon} alt="brezel" className="w-7 h-7" />
              <span className="text-yellow-700 font-bold text-sm">5</span>
            </div>
          </div>
          {/* Progress Bar with XP label */}
          <div className="flex flex-col flex-1 gap-1 w-full">
            <ProgressBar />
          </div>
        </div>
        {/* Avatar with Level Badge */}
        <div className="relative flex max-w-xl flex-shrink-0">
          <Link 
            to="/profile" 
            className="group"
            onMouseLeave={handleMouseLeave}
          >
            <img src={avatar} alt="profile" className="h-20 w-20 rounded-full cursor-pointer group-hover:scale-102" />
            <div className="absolute -top-1 left-1/2 translate-x-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-1 py-1 rounded-full shadow-lg border-2 border-white
            dark:bg-gradient-to-b dark:from-[#05315B] dark:via-[#256996] dark:to-[#3B6978] dark:text-white">
              Lv. {level}
            </div>
          </Link>
        </div>
      </div>

      {/* Global Tooltip */}
      {showTooltip && (
        <div 
          className="fixed z-[9999] px-3 py-2 text-sm text-white bg-black rounded-lg shadow-xl whitespace-nowrap pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translateY(-50%)'
          }}
        >
          {tooltipText}
          <div 
            className="absolute top-1/2 w-0 h-0 border-4 border-transparent border-r-black"
            style={{
              left: '-8px',
              transform: 'translateY(-50%)'
            }}
          ></div>
        </div>
      )}
    </>
  )
}