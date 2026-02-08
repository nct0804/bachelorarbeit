import React from 'react';
import '../../style/FunGreeting.css';

export default function FunGreeting() {
  return (
    <div className="fun-greeting-container">
      <div className="greeting-main">
        <div className="greeting-text">
          Say <span className="hallo-bounce">'Hallo'</span> to fun
        </div>
                
        <div className="greeting-subtitle">
          where learning becomes an adventure
        </div>
      </div>
    </div>
  );
}