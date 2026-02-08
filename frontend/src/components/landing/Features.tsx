import React from 'react';
import { Users, Play, Clock, Gift, BookOpen, Globe } from 'lucide-react';

function Features() {
  return (
    <section id="features" className="py-10 sm:py-14 bg-gray-50" data-test="landing-features">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Course Features
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Everything you need to master German, all in one place - completely free.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-test="landing-features-grid">
          <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow" data-test="feature-card-native-teachers">
            <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-orange-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">Native Teachers</h3>
            <p className="text-gray-600 text-xs">
              Learn from certified native German speakers who understand the nuances 
              of the language and culture.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow" data-test="feature-card-interactive-lessons">
            <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <Play className="h-5 w-5 text-orange-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">Interactive Lessons</h3>
            <p className="text-gray-600 text-xs">
              Engage with multimedia content, interactive exercises, and real-world 
              scenarios that make learning fun.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow" data-test="feature-card-flexible-schedule">
            <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">Flexible Schedule</h3>
            <p className="text-gray-600 text-xs">
              Learn at your own pace with 24/7 access to courses. Perfect for busy 
              professionals and students.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow" data-test="feature-card-free">
            <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <Gift className="h-5 w-5 text-orange-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">Completely Free</h3>
            <p className="text-gray-600 text-xs">
              Access all content, exercises, and learning materials at no cost. 
              No hidden fees or premium subscriptions.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow" data-test="feature-card-materials">
            <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <BookOpen className="h-5 w-5 text-orange-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">Comprehensive Materials</h3>
            <p className="text-gray-600 text-xs">
              Access textbooks, audio files, videos, and practice exercises all 
              included free in the course.
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow" data-test="feature-card-culture">
            <div className="bg-orange-100 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
              <Globe className="h-5 w-5 text-orange-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">Cultural Immersion</h3>
            <p className="text-gray-600 text-xs">
              Learn not just the language but also the culture, traditions, and 
              daily life of Germany through immersive content.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Features; 
