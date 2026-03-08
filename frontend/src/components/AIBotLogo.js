import React from 'react';

const AIBotLogo = ({ size = 80, animated = true }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        position: 'relative'
      }}
      className={animated ? 'ai-bot-logo-animated' : ''}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 0 24px rgba(118, 232, 255, 0.75))',
          position: 'relative'
        }}
      >
        <defs>
          <linearGradient id="iceBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d8f7ff" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#8ad9ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#4cb7ff" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="deepBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6ad0ff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#2e8fff" stopOpacity="0.75" />
          </linearGradient>
          <radialGradient id="aura" cx="50%" cy="48%" r="56%">
            <stop offset="0%" stopColor="#9bf1ff" stopOpacity="0.62" />
            <stop offset="68%" stopColor="#68cfff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#68cfff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lowerFade" x1="0" y1="130" x2="0" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#95e9ff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#95e9ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <ellipse cx="60" cy="88" rx="56" ry="80" fill="url(#aura)" />

        <ellipse cx="60" cy="25" rx="29" ry="11" fill="url(#iceBlue)" />
        <path d="M31 25C31 15 40 9 50 8C56 4 64 4 70 8C80 9 89 15 89 25C89 34 82 38 60 38C38 38 31 34 31 25Z" fill="url(#iceBlue)" />
        <rect x="33" y="33" width="54" height="6" rx="3" fill="#baf2ff" opacity="0.95" />

        <rect x="31" y="39" width="58" height="46" rx="14" fill="url(#deepBlue)" opacity="0.92" />
        <path d="M31 39H89V57C82 59 74 60 60 60C46 60 38 59 31 57V39Z" fill="#cff8ff" opacity="0.22" />

        <path d="M42 54C44 50 47 49 50 54" stroke="#d7fcff" strokeWidth="2" strokeLinecap="round" />
        <path d="M70 54C72 50 75 49 78 54" stroke="#d7fcff" strokeWidth="2" strokeLinecap="round" />
        <path d="M45 67C50 74 70 74 75 67" stroke="#d7fcff" strokeWidth="2.5" strokeLinecap="round" />

        <rect x="34" y="86" width="52" height="52" rx="12" fill="url(#deepBlue)" opacity="0.88" />
        <circle cx="60" cy="106" r="12" fill="none" stroke="#d7fcff" strokeWidth="2" opacity="0.92" />
        <circle cx="60" cy="106" r="5" fill="#d7fcff" opacity="0.9" />

        <rect x="23" y="90" width="10" height="47" rx="5" fill="url(#deepBlue)" opacity="0.86" />
        <rect x="87" y="90" width="10" height="47" rx="5" fill="url(#deepBlue)" opacity="0.86" />
        <circle cx="28" cy="88" r="6" fill="#7ad9ff" opacity="0.85" />
        <circle cx="92" cy="88" r="6" fill="#7ad9ff" opacity="0.85" />

        <path d="M43 138H77V150C77 160 69 167 60 167C51 167 43 160 43 150V138Z" fill="url(#deepBlue)" opacity="0.76" />
        <ellipse cx="60" cy="166" rx="29" ry="14" fill="url(#lowerFade)" />

        <g className="particle-glow" opacity="0.85">
          <circle cx="49" cy="158" r="1.6" fill="#d9fbff" />
          <circle cx="60" cy="161" r="1.8" fill="#d9fbff" />
          <circle cx="71" cy="158" r="1.6" fill="#d9fbff" />
          <circle cx="54" cy="171" r="1.2" fill="#b3f1ff" />
          <circle cx="66" cy="170" r="1.2" fill="#b3f1ff" />
        </g>

        <g className="sparkle" opacity="0.8">
          <circle cx="96" cy="34" r="1.2" fill="#d9fbff" />
          <path d="M96 31V37M93 34H99" stroke="#d9fbff" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

export default AIBotLogo;
