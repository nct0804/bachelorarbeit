import React from 'react';
import { Award, Globe, BookOpen } from 'lucide-react';

function Benefits() {
  return (
    <section className="py-10 sm:py-14 bg-white" data-test="landing-benefits">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Why Learn German With Us?
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto">
            German opens incredible opportunities across Europe, from career advancement 
            to cultural enrichment. Here's why our approach works.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-test="landing-benefits-grid">
          <div className="text-center group" data-test="benefit-card-career">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
              <Award className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1.5">Career Opportunities</h3>
            <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
              Germany is Europe's economic powerhouse. German language skills can boost 
              your earning potential by up to 25% in international companies.
            </p>
          </div>

          <div className="text-center group" data-test="benefit-card-culture">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
              <Globe className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1.5">Rich Culture</h3>
            <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
              Discover the rich heritage of German-speaking countries. From philosophy to 
              music, unlock centuries of cultural treasures.
            </p>
          </div>

          <div className="text-center group sm:col-span-2 lg:col-span-1" data-test="benefit-card-academic">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
              <BookOpen className="h-6 w-6 text-orange-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1.5">Academic Excellence</h3>
            <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
              Germany offers world-class education with many programs taught in German. 
              Open doors to prestigious universities and research opportunities.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Benefits; 
