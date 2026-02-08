import React from 'react';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import Benefits from '../components/landing/Benefits';
import Features from '../components/landing/Features';
import Testimonials from '../components/landing/Testimonials';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import About from '@/components/landing/About';

function LandingPage() {
  return (
    <div className="min-h-screen bg-white" data-test="page-landing">
      <Header />
      <main data-test="landing-main">
        <Hero />
        <Benefits />
        <Features />
        <Testimonials />
        <About />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage; 
