import React from 'react';
import { Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function CTA() {
  const { user } = useAuth();

  return (
    <section id="about" className="relative overflow-hidden bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600" data-test="landing-cta">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center text-white">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
          Ready to Start Your German Adventure?
        </h2>
        <p className="text-sm sm:text-base text-orange-100 max-w-2xl mx-auto mb-5">
          Join a community of over 50,000 learners and start speaking German with confidence. 
          Your first lesson is just a click away, and it's completely free.
        </p>
        <Link to={user ? "/home" : "/login"}>
          <button className="bg-white text-orange-600 px-5 py-2 rounded-full font-semibold text-xs sm:text-sm hover:bg-orange-100 transform hover:scale-105 transition-all duration-200" data-test="landing-cta-button">
            {user ? "Continue Your Adventure" : "Start Learning Now - It's Free!"}
          </button>
        </Link>
      </div>
    </section>
  );
}

export default CTA; 
