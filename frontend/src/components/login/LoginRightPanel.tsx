import React from 'react';
import SplitText from '../custom/SplitText';
import FunGreeting from '../custom/FundGreeting';

export default function LoginRightPanel() {
  return (
    <div
      className="text-white text-center p-8 relative z-10 flex flex-col justify-center h-full min-h-[400px] max-h-[600px] overflow-hidden"
      data-test="login-right-hero"
    >
      <SplitText
        text="Meister Deutsch mit uns"
        className="text-4xl font-bold block text-white mb-4"
        delay={100}
        duration={0.6}
        ease="power3.out"
        splitType="chars"
        from={{ opacity: 0, y: 40, scale: 0.8 }}
        to={{ opacity: 1, y: 0, scale: 1 }}
        threshold={0.1}
        rootMargin="-100px"
        textAlign="center"
        onLetterAnimationComplete={() => console.log('Text animated!')}
      />
      
      <div data-test="login-right-greeting">
        <FunGreeting />
      </div>
    </div>
  );
}
