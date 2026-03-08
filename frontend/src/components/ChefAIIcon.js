import React from 'react';

const ChefAIIcon = ({ size = 28, color = '#9defff', animated = true }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? 'chef-ai-icon-animated' : ''}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 0 10px rgba(118, 232, 255, 0.75))'
      }}
    >
      <defs>
        <linearGradient id="neonBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dbf9ff" stopOpacity="0.96" />
          <stop offset="48%" stopColor="#86d8ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#409dff" stopOpacity="0.78" />
        </linearGradient>
        <radialGradient id="glowEffect" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#9bf1ff" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#68cfff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="48" fill="url(#glowEffect)" opacity="0.8" />

      <ellipse cx="50" cy="15" rx="22" ry="8" fill={color} opacity="0.95" />
      <path
        d="M 28 15 Q 28 10 50 8 Q 72 10 72 15 L 70 22 Q 70 25 50 27 Q 30 25 30 22 Z"
        fill="url(#neonBlue)"
        opacity="0.9"
      />
      <rect x="28" y="22" width="44" height="4" fill={color} opacity="0.88" rx="2" />

      <rect x="25" y="27" width="50" height="48" rx="10" fill="url(#neonBlue)" opacity="0.9" />
      <rect x="25" y="27" width="50" height="20" rx="10" fill={color} opacity="0.2" />

      <path d="M34 43C36 39 39 38 42 43" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M58 43C60 39 63 38 66 43" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M37 54C41 58 59 58 63 54" stroke={color} strokeWidth="2" strokeLinecap="round" />

      <rect x="26" y="75" width="48" height="22" rx="6" fill="url(#neonBlue)" opacity="0.85" />
      <circle cx="50" cy="86" r="6" fill="none" stroke={color} strokeWidth="1.5" opacity="0.85" />
      <circle cx="50" cy="86" r="2.5" fill={color} opacity="0.85" />

      <g className="chef-sparkle" opacity="0.8">
        <circle cx="80" cy="15" r="1.2" fill={color} />
        <path
          d="M 80 12 L 80 18 M 77 15 L 83 15"
          stroke={color}
          strokeWidth="0.7"
          opacity="0.8"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export default ChefAIIcon;
