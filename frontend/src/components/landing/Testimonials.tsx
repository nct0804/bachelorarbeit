import React from 'react';
import { Star } from 'lucide-react';

function Testimonials() {
  return (
    <section id="testimonials" className="py-10 sm:py-14 bg-white" data-test="landing-testimonials">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            What Our Students Say
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Real stories from thousands of satisfied learners worldwide.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-test="landing-testimonials-grid">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200" data-test="testimonial-card-maria">
            <p className="text-gray-700 text-xs mb-3">
              "This platform is a game-changer. The interactive lessons made learning
              German enjoyable and effective. I highly recommend it!"
            </p>
            <div className="flex items-center">
              <img
                src="https://randomuser.me/api/portraits/women/68.jpg"
                alt="Maria S."
                className="w-8 h-8 rounded-full mr-2.5"
              />
              <div>
                <h4 className="font-bold text-gray-900 text-xs">Maria S.</h4>
                <p className="text-gray-500 text-xs">Software Engineer</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200" data-test="testimonial-card-david">
            <p className="text-gray-700 text-xs mb-3">
              "As a student, finding free, high-quality resources is rare. This site
              exceeded all my expectations. I passed my B1 exam thanks to them!"
            </p>
            <div className="flex items-center">
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="David L."
                className="w-8 h-8 rounded-full mr-2.5"
              />
              <div>
                <h4 className="font-bold text-gray-900 text-xs">David L.</h4>
                <p className="text-gray-500 text-xs">University Student</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 sm:col-span-2 lg:col-span-1" data-test="testimonial-card-jessica">
            <p className="text-gray-700 text-xs mb-3">
              "The cultural lessons are my favorite part. It's more than just a
              language course; it's a deep dive into the German way of life.
              And it's all free!"
            </p>
            <div className="flex items-center">
              <img
                src="https://randomuser.me/api/portraits/women/44.jpg"
                alt="Jessica P."
                className="w-8 h-8 rounded-full mr-2.5"
              />
              <div>
                <h4 className="font-bold text-gray-900 text-xs">Jessica P.</h4>
                <p className="text-gray-500 text-xs">Artist</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Testimonials; 
