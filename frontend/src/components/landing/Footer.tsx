import React from 'react';
import { Globe } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-gray-50 border-t" data-test="landing-footer">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-xs" data-test="footer-links">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2.5">Course</h3>
            <ul className="space-y-1.5">
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Beginner (A1)</a></li>
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Elementary (A2)</a></li>
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Intermediate (B1)</a></li>
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Upper-Intermediate (B2)</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2.5">Resources</h3>
            <ul className="space-y-1.5">
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Grammar</a></li>
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Vocabulary</a></li>
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Blog</a></li>
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Community</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2.5">Company</h3>
            <ul className="space-y-1.5">
              <li><a href="#" className="text-gray-600 hover:text-orange-500">About Us</a></li>
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Contact</a></li>
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2.5">Connect</h3>
            <ul className="space-y-1.5">
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Facebook</a></li>
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Twitter</a></li>
              <li><a href="#" className="text-gray-600 hover:text-orange-500">Instagram</a></li>
              <li><a href="#" className="text-gray-600 hover:text-orange-500">YouTube</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-3 sm:mb-0">
            <Globe className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-600">GermanGains</span>
          </div>
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} GermanGains. All rights reserved. Completely free education for all.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 
