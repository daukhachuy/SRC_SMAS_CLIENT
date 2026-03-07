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
          filter: 'drop-shadow(0 0 20px rgba(0, 217, 255, 0.8))',
          position: 'relative'
        }}
      >
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D9FF" stopOpacity="1" />
            <stop offset="50%" stopColor="#0099FF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#005BFF" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF00FF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#8000FF" stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id="glowEffect" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0099FF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Glow Background */}
        <circle cx="60" cy="90" r="70" fill="url(#glowEffect)" opacity="0.6" />

        {/* ===== HEAD ===== */}
        
        {/* Chef Hat */}
        <ellipse cx="60" cy="20" rx="28" ry="12" fill="#00D9FF" opacity="0.95" filter="drop-shadow(0 0 8px rgba(0, 217, 255, 0.9))" />
        <path
          d="M 32 20 Q 32 12 60 8 Q 88 12 88 20 L 86 30 Q 86 34 60 36 Q 34 34 34 30 Z"
          fill="url(#bodyGradient)"
          opacity="0.9"
          filter="drop-shadow(0 0 6px rgba(0, 217, 255, 0.8))"
        />

        {/* Hat Band */}
        <rect x="32" y="30" width="56" height="6" fill="#00D9FF" opacity="0.85" rx="3" filter="drop-shadow(0 0 4px rgba(0, 217, 255, 0.7))" />

        {/* Head Visor */}
        <rect x="28" y="36" width="64" height="48" rx="12" fill="url(#bodyGradient)" opacity="0.9" filter="drop-shadow(0 0 10px rgba(0, 217, 255, 0.8))" />

        {/* Face Visor Glow */}
        <rect x="28" y="36" width="64" height="24" rx="12" fill="#00D9FF" opacity="0.2" />

        {/* Eyes - Large Digital */}
        <circle cx="42" cy="52" r="7" fill="none" stroke="#00D9FF" strokeWidth="2" opacity="0.95" filter="drop-shadow(0 0 5px rgba(0, 217, 255, 0.9))" />
        <circle cx="78" cy="52" r="7" fill="none" stroke="#00D9FF" strokeWidth="2" opacity="0.95" filter="drop-shadow(0 0 5px rgba(0, 217, 255, 0.9))" />
        
        {/* Pupils */}
        <circle cx="42" cy="52" r="3.5" fill="#00D9FF" opacity="1" filter="drop-shadow(0 0 4px rgba(0, 217, 255, 1))" />
        <circle cx="78" cy="52" r="3.5" fill="#00D9FF" opacity="1" filter="drop-shadow(0 0 4px rgba(0, 217, 255, 1))" />

        {/* Smile Arc */}
        <path
          d="M 40 66 Q 60 76 80 66"
          stroke="#00D9FF"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.9"
          filter="drop-shadow(0 0 4px rgba(0, 217, 255, 0.8))"
        />

        {/* ===== BODY ===== */}

        {/* Main Body */}
        <rect x="26" y="85" width="68" height="65" rx="10" fill="url(#bodyGradient)" opacity="0.88" filter="drop-shadow(0 0 10px rgba(0, 217, 255, 0.7))" />

        {/* Chest AI Core Circle */}
        <circle cx="60" cy="105" r="12" fill="none" stroke="#FF00FF" strokeWidth="2.5" opacity="0.85" filter="drop-shadow(0 0 6px rgba(255, 0, 255, 0.8))" />
        <circle cx="60" cy="105" r="6" fill="#FF00FF" opacity="0.95" filter="drop-shadow(0 0 5px rgba(255, 0, 255, 1))" />

        {/* Chest Tech Details */}
        <circle cx="48" cy="90" r="2" fill="#00D9FF" opacity="0.8" filter="drop-shadow(0 0 3px rgba(0, 217, 255, 0.8))" />
        <circle cx="72" cy="90" r="2" fill="#00D9FF" opacity="0.8" filter="drop-shadow(0 0 3px rgba(0, 217, 255, 0.8))" />
        <circle cx="48" cy="120" r="2" fill="#00D9FF" opacity="0.8" filter="drop-shadow(0 0 3px rgba(0, 217, 255, 0.8))" />
        <circle cx="72" cy="120" r="2" fill="#00D9FF" opacity="0.8" filter="drop-shadow(0 0 3px rgba(0, 217, 255, 0.8))" />

        {/* Connection Lines to Core */}
        <line x1="48" y1="90" x2="55" y2="101" stroke="#00D9FF" strokeWidth="1" opacity="0.5" />
        <line x1="72" y1="90" x2="65" y2="101" stroke="#00D9FF" strokeWidth="1" opacity="0.5" />
        <line x1="48" y1="120" x2="55" y2="109" stroke="#00D9FF" strokeWidth="1" opacity="0.5" />
        <line x1="72" y1="120" x2="65" y2="109" stroke="#00D9FF" strokeWidth="1" opacity="0.5" />

        {/* Arms */}
        {/* Left Arm */}
        <rect x="18" y="90" width="10" height="50" rx="5" fill="url(#bodyGradient)" opacity="0.85" filter="drop-shadow(0 0 6px rgba(0, 217, 255, 0.6))" />
        <circle cx="23" cy="87" r="7" fill="url(#bodyGradient)" opacity="0.85" filter="drop-shadow(0 0 5px rgba(0, 217, 255, 0.6))" />
        <circle cx="23" cy="142" r="6" fill="#FF00FF" opacity="0.7" filter="drop-shadow(0 0 4px rgba(255, 0, 255, 0.7))" />

        {/* Right Arm */}
        <rect x="92" y="90" width="10" height="50" rx="5" fill="url(#bodyGradient)" opacity="0.85" filter="drop-shadow(0 0 6px rgba(0, 217, 255, 0.6))" />
        <circle cx="97" cy="87" r="7" fill="url(#bodyGradient)" opacity="0.85" filter="drop-shadow(0 0 5px rgba(0, 217, 255, 0.6))" />
        <circle cx="97" cy="142" r="6" fill="#FF00FF" opacity="0.7" filter="drop-shadow(0 0 4px rgba(255, 0, 255, 0.7))" />

        {/* Legs */}
        {/* Left Leg */}
        <rect x="38" y="150" width="11" height="35" rx="5" fill="url(#bodyGradient)" opacity="0.85" filter="drop-shadow(0 0 6px rgba(0, 217, 255, 0.6))" />

        {/* Right Leg */}
        <rect x="71" y="150" width="11" height="35" rx="5" fill="url(#bodyGradient)" opacity="0.85" filter="drop-shadow(0 0 6px rgba(0, 217, 255, 0.6))" />

        {/* ===== PARTICLES / GLOW ===== */}
        <g className="particle-glow" opacity="0.8">
          <circle cx="55" cy="175" r="1.5" fill="#00D9FF" filter="drop-shadow(0 0 3px rgba(0, 217, 255, 0.9))" />
          <circle cx="65" cy="175" r="1.5" fill="#00D9FF" filter="drop-shadow(0 0 3px rgba(0, 217, 255, 0.9))" />
          <circle cx="50" cy="170" r="1" fill="#FF00FF" opacity="0.7" filter="drop-shadow(0 0 2px rgba(255, 0, 255, 0.8))" />
          <circle cx="70" cy="170" r="1" fill="#FF00FF" opacity="0.7" filter="drop-shadow(0 0 2px rgba(255, 0, 255, 0.8))" />
        </g>

        {/* Top Sparkles */}
        <g className="sparkle" opacity="0.7">
          <circle cx="95" cy="25" r="1.5" fill="#00D9FF" filter="drop-shadow(0 0 3px rgba(0, 217, 255, 0.9))" />
          <path
            d="M 95 22 L 95 28 M 92 25 L 98 25"
            stroke="#00D9FF"
            strokeWidth="0.8"
            opacity="0.8"
            strokeLinecap="round"
          />
        </g>

        {/* Side Sparkles */}
        <g className="sparkle" opacity="0.6" style={{ animationDelay: '0.5s' }}>
          <circle cx="12" cy="60" r="1" fill="#FF00FF" filter="drop-shadow(0 0 2px rgba(255, 0, 255, 0.9))" />
          <path
            d="M 12 57 L 12 63 M 9 60 L 15 60"
            stroke="#FF00FF"
            strokeWidth="0.7"
            opacity="0.7"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
};

export default AIBotLogo;
