import React from 'react';
import { Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function Header() {
  const { user } = useAuth();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Approximate header height
      const elementPosition = element.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50" data-test="landing-header">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2.5">
          <button onClick={() => scrollToSection('hero')} className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0" data-test="landing-logo">
            <Globe className="h-6 w-6 text-orange-500" />
            <h1 className="text-lg font-bold text-gray-900">GermanGains</h1>
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden md:flex items-center space-x-5" data-test="landing-nav">
            <button 
              onClick={() => scrollToSection('features')}
              data-test="landing-nav-features"
              className="text-xs text-gray-600 hover:text-orange-500 transition-colors font-medium"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')}
              data-test="landing-nav-reviews"
              className="text-xs text-gray-600 hover:text-orange-500 transition-colors font-medium"
            >
              Reviews
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              data-test="landing-nav-about"
              className="text-xs text-gray-600 hover:text-orange-500 transition-colors font-medium"
            >
              About
            </button>
            </nav>
            {user ? (
              <Link to="/home">
                <button className="bg-orange-500 text-white px-3 sm:px-4 py-1.5 rounded-full hover:bg-orange-600 transition-colors text-xs font-semibold whitespace-nowrap" data-test="landing-cta-dashboard">
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <button
                    className="border border-orange-200 bg-white text-orange-600 px-3 sm:px-4 py-1.5 rounded-full hover:bg-orange-50 transition-colors text-xs font-semibold whitespace-nowrap"
                    data-test="landing-cta-signin"
                  >
                    Sign In
                  </button>
                </Link>
                <Link to="/register">
                  <button
                    className="bg-orange-500 text-white px-3 sm:px-4 py-1.5 rounded-full hover:bg-orange-600 transition-colors text-xs font-semibold whitespace-nowrap"
                    data-test="landing-cta-signup"
                  >
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header; 
