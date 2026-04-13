import React from 'react';

const Skeleton = ({ width, height, borderRadius, style, variant = 'rectangular' }) => {
  const baseStyle = {
    width: width || '100%',
    height: height || '20px',
    borderRadius: borderRadius || (variant === 'circular' ? '50%' : '8px'),
    ...style
  };

  return <div className={`skeleton ${variant}`} style={baseStyle}></div>;
};

export default Skeleton;
