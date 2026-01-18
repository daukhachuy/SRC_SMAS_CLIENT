import React from 'react';

const RestaurantLogo = ({ size = 64, color = 'white' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main Dome/Cloche */}
      <path
        d="M100 40C70 40 50 60 50 90V110C50 130 70 150 100 150C130 150 150 130 150 110V90C150 60 130 40 100 40Z"
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dome Handle */}
      <path
        d="M85 35C85 25 92 20 100 20C108 20 115 25 115 35"
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left Fork */}
      <g>
        <line x1="25" y1="90" x2="35" y2="110" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <line x1="30" y1="115" x2="30" y2="145" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <circle cx="20" cy="95" r="3" fill={color} />
        <circle cx="22" cy="102" r="3" fill={color} />
        <circle cx="28" cy="108" r="3" fill={color} />
      </g>

      {/* Right Spoon */}
      <g>
        <path
          d="M175 90C175 105 165 120 155 125C150 127 145 125 145 115L145 110"
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx="165" cy="130" rx="12" ry="8" stroke={color} strokeWidth="4" fill="none" />
      </g>

      {/* Bowl/Plate Bottom */}
      <path
        d="M60 140C60 155 75 165 100 165C125 165 140 155 140 140"
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Food inside bowl (simple decorative lines) */}
      <path
        d="M75 145C80 142 85 142 90 145"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M110 145C115 142 120 142 125 145"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default RestaurantLogo;
