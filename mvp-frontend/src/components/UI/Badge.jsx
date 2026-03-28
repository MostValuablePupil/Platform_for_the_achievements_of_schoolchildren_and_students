// src/components/UI/Badge.jsx
import React from 'react';

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'badge-default',
    success: 'badge-success',
    warning: 'badge-warning',
    info: 'badge-info',
    вуз: 'badge-vuz',
    курсы: 'badge-courses',
  };

  return (
    <span className={`badge ${variants[variant.toLowerCase()] || variants.default}`}>
      {children}
    </span>
  );
};

export default Badge;
