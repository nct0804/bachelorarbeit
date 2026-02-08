import React from 'react';
import { Star, Users, Gift, CheckCircle, Play, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function Hero() {
  const { user } = useAuth();

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 min-h-screen flex items-center"
      data-test="landing-hero" id="hero"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
      <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[60vh]">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 bg-white/20 text-white px-3 py-1 rounded-full text-xs font-medium">
                <Gift className="h-3 w-3" />
                <span>100% Free - Completely Free!</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                Master German 
                <span className="block">with us!</span>
              </h1>
              <p className="text-sm sm:text-base text-orange-100 leading-relaxed">
              We're young programmers in Germany who've faced the struggles of learning German firsthand. 
              That's why we built this free platform to make learning German practical and effective for you
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-orange-100 font-medium">
                🇩🇪 Say "Hallo" to opportunities in Europe's largest economy
              </p>
              <div className="flex items-center flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 text-xs">
                <div className="flex items-center space-x-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>50,000+ learners</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Star className="h-3.5 w-3.5 text-yellow-300" />
                  <span>4.9/5 rating</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Gift className="h-3.5 w-3.5 text-green-300" />
                  <span className="font-bold">100% Free</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5" data-test="landing-hero-cta">
              <Link to={user ? "/home" : "/login"}>
                <button data-test="hero-start-learning" className="bg-white text-orange-600 px-5 py-2 rounded-full font-semibold text-xs sm:text-sm hover:bg-orange-100 transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 w-full sm:w-auto">
                  <span>{user ? "Continue Learning" : "Start Learning Now"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <button data-test="hero-watch-demo" className="border-2 border-white/50 text-white px-5 py-2 rounded-full font-semibold text-xs sm:text-sm hover:bg-white/10 transition-colors flex items-center justify-center space-x-2 w-full sm:w-auto">
                <Play className="h-4 w-4" />
                <span>Watch Demo</span>
              </button>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span>Lifetime access</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span>Completely free</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <img 
                src="https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg" 
                alt="German learning materials" 
                className="w-full h-52 object-cover rounded-2xl mb-5"
              />
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900">Interactive Learning</h3>
                <p className="text-sm text-gray-700">Experience German through engaging conversations, games, and real-life scenarios.</p>
                <div className="flex items-center space-x-2 text-green-600">
                  <Gift className="h-4 w-4" />
                  <span className="font-medium text-sm">Completely free</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero; 
