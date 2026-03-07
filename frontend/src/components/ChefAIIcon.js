import React from 'react';

const ChefAIIcon = ({ size = 28, color = '#00D9FF', animated = true }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? 'chef-ai-icon-animated' : ''}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 0 8px rgba(0, 217, 255, 0.6))' }}
    >
      <defs>
        <linearGradient id="neonBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D9FF" stopOpacity="1" />
          <stop offset="50%" stopColor="#0099FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#005BFF" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="neonPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF00FF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#8000FF" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="glowEffect" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0099FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Glow Background */}
      <circle cx="50" cy="50" r="48" fill="url(#glowEffect)" opacity="0.8" />

      {/* Chef Hat - Neon Style */}
      <ellipse cx="50" cy="15" rx="22" ry="8" fill="#00D9FF" opacity="0.95" filter="drop-shadow(0 0 6px rgba(0, 217, 255, 0.8))" />
      <path
        d="M 28 15 Q 28 10 50 8 Q 72 10 72 15 L 70 22 Q 70 25 50 27 Q 30 25 30 22 Z"
        fill="url(#neonBlue)"
        opacity="0.9"
        filter="drop-shadow(0 0 4px rgba(0, 217, 255, 0.7))"
      />

      {/* Hat Band */}
      <rect x="28" y="22" width="44" height="4" fill="#00D9FF" opacity="0.8" rx="2" filter="drop-shadow(0 0 3px rgba(0, 217, 255, 0.6))" />

      {/* Head - Rounded Neon */}
      <rect x="25" y="27" width="50" height="48" rx="10" fill="url(#neonBlue)" opacity="0.85" filter="drop-shadow(0 0 8px rgba(0, 217, 255, 0.7))" />

      {/* Tech visor glow */}
      <rect x="25" y="27" width="50" height="20" rx="10" fill="#00D9FF" opacity="0.15" filter="drop-shadow(0 0 6px rgba(0, 217, 255, 0.8))" />

      {/* Eyes - Digital Style with Glow */}
      <circle cx="35" cy="40" r="5" fill="none" stroke="#00D9FF" strokeWidth="1.5" opacity="0.9" filter="drop-shadow(0 0 4px rgba(0, 217, 255, 0.8))" />
      <circle cx="65" cy="40" r="5" fill="none" stroke="#00D9FF" strokeWidth="1.5" opacity="0.9" filter="drop-shadow(0 0 4px rgba(0, 217, 255, 0.8))" />
      
      {/* Digital pupils with glow */}
      <circle cx="35" cy="40" r="2.5" fill="#00D9FF" opacity="0.9" filter="drop-shadow(0 0 3px rgba(0, 217, 255, 1))" />
      <circle cx="65" cy="40" r="2.5" fill="#00D9FF" opacity="0.9" filter="drop-shadow(0 0 3px rgba(0, 217, 255, 1))" />

      {/* Smile - Neon */}
      <path
        d="M 35 52 Q 50 60 65 52"
        stroke="#00D9FF"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
        filter="drop-shadow(0 0 3px rgba(0, 217, 255, 0.7))"
      />

      {/* Cheeks - Neon Glow */}
      <circle cx="25" cy="47" r="3" fill="#FF00FF" opacity="0.5" filter="drop-shadow(0 0 4px rgba(255, 0, 255, 0.6))" />
      <circle cx="75" cy="47" r="3" fill="#FF00FF" opacity="0.5" filter="drop-shadow(0 0 4px rgba(255, 0, 255, 0.6))" />

      {/* Body - Neon Suit */}
      <rect x="26" y="75" width="48" height="22" rx="6" fill="url(#neonBlue)" opacity="0.8" filter="drop-shadow(0 0 6px rgba(0, 217, 255, 0.6))" />

      {/* Chest AI Core - Circular Tech */}
      <circle cx="50" cy="86" r="6" fill="none" stroke="#FF00FF" strokeWidth="1.5" opacity="0.8" filter="drop-shadow(0 0 4px rgba(255, 0, 255, 0.7))" />
      <circle cx="50" cy="86" r="3" fill="#FF00FF" opacity="0.9" filter="drop-shadow(0 0 3px rgba(255, 0, 255, 1))" />

      {/* Tech Nodes around core */}
      <circle cx="42" cy="78" r="1" fill="#00D9FF" opacity="0.8" filter="drop-shadow(0 0 2px rgba(0, 217, 255, 0.8))" />
      <circle cx="58" cy="78" r="1" fill="#00D9FF" opacity="0.8" filter="drop-shadow(0 0 2px rgba(0, 217, 255, 0.8))" />
      <circle cx="42" cy="94" r="1" fill="#00D9FF" opacity="0.8" filter="drop-shadow(0 0 2px rgba(0, 217, 255, 0.8))" />
      <circle cx="58" cy="94" r="1" fill="#00D9FF" opacity="0.8" filter="drop-shadow(0 0 2px rgba(0, 217, 255, 0.8))" />

      {/* Connection lines */}
      <line x1="42" y1="78" x2="50" y2="86" stroke="#00D9FF" strokeWidth="0.8" opacity="0.5" />
      <line x1="58" y1="78" x2="50" y2="86" stroke="#00D9FF" strokeWidth="0.8" opacity="0.5" />
      <line x1="42" y1="94" x2="50" y2="86" stroke="#00D9FF" strokeWidth="0.8" opacity="0.5" />
      <line x1="58" y1="94" x2="50" y2="86" stroke="#00D9FF" strokeWidth="0.8" opacity="0.5" />

      {/* Holographic Sparkles */}
      <g className="chef-sparkle" opacity="0.8">
        <circle cx="80" cy="15" r="1.2" fill="#00D9FF" filter="drop-shadow(0 0 2px rgba(0, 217, 255, 0.9))" />
        <path
          d="M 80 12 L 80 18 M 77 15 L 83 15"
          stroke="#00D9FF"
          strokeWidth="0.7"
          opacity="0.8"
          strokeLinecap="round"
        />
      </g>

      {/* Secondary Sparkle */}
      <g className="chef-sparkle" opacity="0.6" style={{ animationDelay: '0.5s' }}>
        <circle cx="15" cy="35" r="0.8" fill="#FF00FF" filter="drop-shadow(0 0 2px rgba(255, 0, 255, 0.8))" />
        <path
          d="M 15 33 L 15 37 M 13 35 L 17 35"
          stroke="#FF00FF"
          strokeWidth="0.6"
          opacity="0.7"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export default ChefAIIcon;
