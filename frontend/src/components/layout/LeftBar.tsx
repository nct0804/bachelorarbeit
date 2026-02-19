import { Link, useLocation } from 'react-router-dom';

import MoreIcon from '../../assets/more-2.png';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLogout } from '@/hooks/useLogOut';
import HomeIcon from '../../assets/home-2.png';
import LeftBarIcon2 from '../../assets/leftbar-2.png';
import RankingIcon from '../../assets/ranking-2.png';
import LeftBarIcon5 from '../../assets/leftbar-4.png';
import DarkModeToggle from '../ui/DarkModeToggle';
import { useMenu } from './MenuContext';
import profileIcon from '../../assets/profile2.png';
import aboutUsIcon from '../../assets/AboutUs.png';
import { LogOut } from 'lucide-react';
import voiceIcon from '../../assets/voice.png';
import chestIcon from '../../assets/chest.png';
import brezelIcon from '../../assets/brezel.png';
import avatarIcon from '../../assets/avatar.png';

const menuItems = [
  { to: '/home', icon: HomeIcon, label: 'Home' },
  { to: '/challenge', icon: LeftBarIcon2, label: 'Challenge' },
  { to: '/ranking', icon: RankingIcon, label: 'Ranking' },
  { to: '/pronunciation', icon: LeftBarIcon5, label: 'Pronunciation' },
  { to: '/speak', icon: voiceIcon, label: 'Speak' },
  { to: '/review', icon: brezelIcon, label: 'Review' },
  { to: '/inbox', icon: avatarIcon, label: 'Inbox' },
  { to: '/achievements', icon: chestIcon, label: 'Achievements' },
];

export default function LeftBar() {
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const { isMenuOpen, setIsMenuOpen } = useMenu();
  const { logout, loading: logoutLoading } = useLogout();
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close if clicking outside the menu area
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, setIsMenuOpen]);

  const handleMoreIconClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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

  const handleLogoutClick = () => {
    setShowTooltip(false);
    setShowLogoutConfirm(true);
  };

  const handleContinueSession = () => {
    setShowLogoutConfirm(false);
  };

  const handleConfirmLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
    setIsMenuOpen(false);
  };

  return (
    <>
      <aside
        className="h-full flex flex-col justify-between w-25 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 rounded-3xl shadow-lg
      dark:bg-gradient-to-b dark:from-[#05315B] dark:via-[#256996] dark:to-[#3B6978] dark:text-white"
        data-test="main-leftbar"
      >
        <div className="flex flex-col items-center gap-3 py-4" data-test="main-nav">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            const dataTest = `main-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  'flex items-center justify-center rounded-lg p-3 transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  isActive ? 'bg-white/20 scale-105 shadow-md backdrop-blur-sm' : 'hover:bg-white/10'
                )}
                onMouseEnter={(e) => handleMouseEnter(item.label, e)}
                onMouseLeave={handleMouseLeave}
                data-test={dataTest}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {typeof item.icon === 'string' ? (
                    <img
                      src={item.icon}
                      className="w-full h-full object-contain filter brightness-0 invert"
                      alt={item.label}
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={item.icon}
                      className="text-[1.75rem] text-white"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-3 mb-4" ref={menuRef}>
          <div
            onMouseEnter={(e) => handleMouseEnter('Toggle Dark Mode', e)}
            onMouseLeave={handleMouseLeave}
            data-test="main-darkmode"
          >
            <DarkModeToggle />
          </div>
          
          {/* Menu Items - Show when menu is open with animation */}
          <div className={`flex flex-col items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
          }`} data-test="main-more-panel">
            <div className={`transition-all duration-300 transform ${
              isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            }`} style={{ transitionDelay: isMenuOpen ? '0ms' : '200ms' }}>
              <Link
                to="/profile"
                className="flex items-center justify-center rounded-lg p-3 transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-white/10"
                onClick={() => setIsMenuOpen(false)}
                onMouseEnter={(e) => handleMouseEnter('Profile', e)}
                onMouseLeave={handleMouseLeave}
                data-test="main-menu-profile"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <img
                    src={profileIcon}
                    className="w-full h-full object-contain filter brightness-0 invert"
                    alt="Profile"
                  />
                </div>
              </Link>
            </div>
            
            <div className={`transition-all duration-300 transform ${
              isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            }`} style={{ transitionDelay: isMenuOpen ? '50ms' : '150ms' }}>
              <Link
                to="/aboutus"
                className="flex items-center justify-center rounded-lg p-3 transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-white/10"
                onClick={() => setIsMenuOpen(false)}
                onMouseEnter={(e) => handleMouseEnter('About Us', e)}
                onMouseLeave={handleMouseLeave}
                data-test="main-menu-about"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <img
                    src={aboutUsIcon}
                    className="w-full h-full object-contain filter brightness-0 invert"
                    alt="About Us"
                  />
                </div>
              </Link>
            </div>
            
            <div className={`transition-all duration-300 transform ${
              isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
            }`} style={{ transitionDelay: isMenuOpen ? '100ms' : '100ms' }}>
              <button
                onClick={handleLogoutClick}
                disabled={logoutLoading}
                className="flex items-center justify-center rounded-lg p-3 transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-white/10 disabled:opacity-50 relative"
                onMouseEnter={(e) => handleMouseEnter('Logout', e)}
                onMouseLeave={handleMouseLeave}
                data-test="main-menu-logout"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <LogOut className="w-full h-full text-white" />
                </div>
                {logoutLoading && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
              </button>
            </div>
          </div>
          
          <div className="relative flex justify-center">
            <button
              onClick={handleMoreIconClick}
              className={clsx(
                'flex items-center justify-center rounded-lg p-3 transition-all duration-300 ease-in-out',
                'hover:scale-105 active:scale-95',
                isMenuOpen ? 'bg-white/20 scale-105 shadow-md backdrop-blur-sm rotate-180' : 'hover:bg-white/10 rotate-0'
              )}
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
              onMouseEnter={(e) => handleMouseEnter(isMenuOpen ? 'Close Menu' : 'More Options', e)}
              onMouseLeave={handleMouseLeave}
              data-test="main-menu-toggle"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <img 
                  src={MoreIcon} 
                  alt="More options" 
                  className={`w-full h-full object-contain filter brightness-0 invert transition-transform duration-300 ${
                    isMenuOpen ? 'rotate-180' : 'rotate-0'
                  }`} 
                />
              </div>
            </button>
            
            {/* Pulse animation when menu is open */}
            {isMenuOpen && (
              <div className="absolute inset-0 rounded-lg bg-white/10 animate-pulse"></div>
            )}
          </div>
        </div>
      </aside>

      {/* Global Tooltip */}
      {showTooltip && (
        <div 
          className="fixed z-[9999] px-3 py-2 text-sm text-white bg-black rounded-lg shadow-xl whitespace-nowrap pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translateY(-50%)'
          }}
          data-test="main-tooltip"
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

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4"
          data-test="main-logout-modal"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white" data-test="main-logout-modal-title">
              Confirm Logout
            </h3>
            <p className="mb-5 text-sm text-gray-600 dark:text-gray-300" data-test="main-logout-modal-message">
              Do you want to log out now?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleContinueSession}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                data-test="main-logout-continue"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={logoutLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                data-test="main-logout-confirm"
              >
                {logoutLoading ? 'Logging out...' : 'Log out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
