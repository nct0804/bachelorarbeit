import React from 'react';

export default function AnimatedBackgroundEffects() {
  return (
    <>
      <div className="absolute inset-0">
        <div 
          className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full animate-float-sync" 
          style={{animationDelay: '0s'}}
        ></div>
        <div 
          className="absolute top-40 right-32 w-3 h-3 bg-orange-300/30 rounded-full animate-float-sync" 
          style={{animationDelay: '4s'}}
        ></div>
        <div 
          className="absolute bottom-32 left-40 w-5 h-5 bg-white/15 rounded-full animate-float-sync" 
          style={{animationDelay: '8s'}}
        ></div>
        <div 
          className="absolute bottom-20 right-20 w-2 h-2 bg-orange-200/40 rounded-full animate-float-sync" 
          style={{animationDelay: '2s'}}
        ></div>
        <div 
          className="absolute top-60 left-60 w-3 h-3 bg-white/25 rounded-full animate-float-sync" 
          style={{animationDelay: '6s'}}
        ></div>
        <div 
          className="absolute top-1/3 right-1/4 w-6 h-6 bg-orange-400/20 rounded-full animate-float-sync" 
          style={{animationDelay: '10s'}}
        ></div>
        <div 
          className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-white/30 rounded-full animate-float-sync" 
          style={{animationDelay: '12s'}}
        ></div>
        
        <div 
          className="absolute top-32 left-32 w-16 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-45 animate-line-flow" 
          style={{animationDelay: '0s'}}
        ></div>
        <div 
          className="absolute bottom-40 right-40 w-20 h-0.5 bg-gradient-to-r from-transparent via-orange-300/30 to-transparent -rotate-12 animate-line-flow" 
          style={{animationDelay: '8s'}}
        ></div>
        <div 
          className="absolute top-1/2 left-16 w-12 h-0.5 bg-gradient-to-r from-transparent via-white/15 to-transparent rotate-12 animate-line-flow" 
          style={{animationDelay: '4s'}}
        ></div>
        <div 
          className="absolute top-3/4 right-16 w-14 h-0.5 bg-gradient-to-r from-transparent via-orange-200/25 to-transparent -rotate-45 animate-line-flow" 
          style={{animationDelay: '12s'}}
        ></div>
        
        <div 
          className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full animate-circle-shimmer" 
          style={{animationDelay: '0s'}}
        ></div>
        <div 
          className="absolute -bottom-20 -left-20 w-32 h-32 bg-orange-300/10 rounded-full animate-circle-shimmer" 
          style={{animationDelay: '4s'}}
        ></div>
        <div 
          className="absolute top-1/2 -right-16 w-36 h-36 bg-white/8 rounded-full animate-circle-shimmer" 
          style={{animationDelay: '2s'}}
        ></div>
        
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-orange-100/10 animate-gradient-sync"></div>
        
        <div 
          className="absolute top-1/4 left-1/3 w-1 h-1 bg-white rounded-full animate-sparkle" 
          style={{animationDelay: '2s'}}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-orange-200 rounded-full animate-sparkle" 
          style={{animationDelay: '6s'}}
        ></div>
        <div 
          className="absolute top-2/3 left-1/4 w-1 h-1 bg-white rounded-full animate-sparkle" 
          style={{animationDelay: '10s'}}
        ></div>
        <div 
          className="absolute bottom-2/3 right-1/4 w-1 h-1 bg-orange-300 rounded-full animate-sparkle" 
          style={{animationDelay: '14s'}}
        ></div>
      </div>

      <style>{`
        /* Synchronized floating animation - matches 16s silkFlow timing */
        @keyframes float-sync {
          0% {
            transform: translateY(0px) rotate(0deg) scale(1);
            opacity: 0.6;
            filter: brightness(1);
          }
          25% {
            transform: translateY(-10px) rotate(90deg) scale(1.1);
            opacity: 0.8;
            filter: brightness(1.2);
          }
          50% {
            transform: translateY(-20px) rotate(180deg) scale(1.2);
            opacity: 1;
            filter: brightness(1.3);
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
          }
          75% {
            transform: translateY(-10px) rotate(270deg) scale(1.1);
            opacity: 0.8;
            filter: brightness(1.2);
          }
          100% {
            transform: translateY(0px) rotate(360deg) scale(1);
            opacity: 0.6;
            filter: brightness(1);
          }
        }
        
        .animate-float-sync {
          animation: float-sync 16s cubic-bezier(0.17, 0.67, 0.83, 0.67) infinite;
        }
        
        /* Line flow animation - synchronized with background */
        @keyframes line-flow {
          0% {
            opacity: 0.3;
            transform: translateX(0) scale(1);
            filter: brightness(1);
          }
          25% {
            opacity: 0.6;
            transform: translateX(20px) scale(1.1);
            filter: brightness(1.2);
          }
          50% {
            opacity: 1;
            transform: translateX(40px) scale(1.2);
            filter: brightness(1.4);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
          }
          75% {
            opacity: 0.6;
            transform: translateX(20px) scale(1.1);
            filter: brightness(1.2);
          }
          100% {
            opacity: 0.3;
            transform: translateX(0) scale(1);
            filter: brightness(1);
          }
        }
        
        .animate-line-flow {
          animation: line-flow 16s cubic-bezier(0.17, 0.67, 0.83, 0.67) infinite;
        }
        
        /* Circle shimmer - matches shimmer timing */
        @keyframes circle-shimmer {
          0% {
            transform: rotate(0deg) scale(1);
            opacity: 0.3;
            filter: brightness(1);
          }
          50% {
            transform: rotate(180deg) scale(1.1);
            opacity: 0.6;
            filter: brightness(1.3);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
          }
          100% {
            transform: rotate(360deg) scale(1);
            opacity: 0.3;
            filter: brightness(1);
          }
        }
        
        .animate-circle-shimmer {
          animation: circle-shimmer 8s linear infinite;
        }
        
        /* Gradient sync animation */
        @keyframes gradient-sync {
          0% {
            opacity: 0.3;
            transform: translateX(0) translateY(0);
          }
          25% {
            opacity: 0.5;
            transform: translateX(10px) translateY(5px);
          }
          50% {
            opacity: 0.7;
            transform: translateX(20px) translateY(10px);
          }
          75% {
            opacity: 0.5;
            transform: translateX(10px) translateY(5px);
          }
          100% {
            opacity: 0.3;
            transform: translateX(0) translateY(0);
          }
        }
        
        .animate-gradient-sync {
          animation: gradient-sync 16s cubic-bezier(0.17, 0.67, 0.83, 0.67) infinite;
        }
        
        /* Sparkle animation */
        @keyframes sparkle {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
          }
          100% {
            opacity: 0;
            transform: scale(0);
          }
        }
        
        .animate-sparkle {
          animation: sparkle 3s ease-in-out infinite;
        }
        
        /* Text glow effect */
        @keyframes text-glow {
          0% {
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
          }
          50% {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 0 0 30px rgba(234, 88, 12, 0.3);
          }
          100% {
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
          }
        }
        
        .animate-text-glow {
          animation: text-glow 4s ease-in-out infinite;
        }
        
        /* Synchronized pulse for indicators */
        @keyframes pulse-sync {
          0% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
            box-shadow: 0 0 10px currentColor;
          }
          100% {
            opacity: 0.7;
            transform: scale(1);
          }
        }
        
        .animate-pulse-sync {
          animation: pulse-sync 16s cubic-bezier(0.17, 0.67, 0.83, 0.67) infinite;
        }
        
        /* Synchronized fade in */
        @keyframes fade-in-sync {
          from {
            opacity: 0;
            transform: translateY(20px);
            filter: brightness(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: brightness(1);
          }
        }
        
        .animate-fade-in-sync {
          animation: fade-in-sync 1.2s ease-out forwards;
        }
      `}</style>
    </>
  );
}