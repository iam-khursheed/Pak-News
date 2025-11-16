import React from 'react';

interface RefreshIconProps {
  isSpinning: boolean;
}

const RefreshIcon: React.FC<RefreshIconProps> = ({ isSpinning }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4a12 12 0 0116 13.5M20 20a12 12 0 01-16-13.5" />
  </svg>
);

export default RefreshIcon;