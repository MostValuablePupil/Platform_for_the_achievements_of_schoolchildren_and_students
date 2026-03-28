// src/components/UI/StatCard.jsx
import React from 'react';

const StatCard = ({ number, label, icon }) => {
  return (
    <div className="stat-card">
      <div className="stat-number">{number}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default StatCard;