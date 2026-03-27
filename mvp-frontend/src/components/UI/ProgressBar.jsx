// src/components/UI/ProgressBar.jsx
import React from 'react';

const ProgressBar = ({ current, max, label, showLabel = true }) => {
  const percentage = Math.min((current / max) * 100, 100);
  
  return (
    <div className="progress-bar-container">
      {showLabel && (
        <div className="progress-bar-label">
          <span>{label}</span>
          <span>{current} / {max} XP</span>
        </div>
      )}
      <div className="progress-bar">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;