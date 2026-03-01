import React from 'react';

const RestaurantLogo = ({ size = 64, color = 'white' }) => {
  return (
    <img 
      src="https://res.cloudinary.com/dmzuier4p/image/upload/v1772344074/image_nxgnsu.webp"
      alt="Restaurant Logo"
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: '8px'
      }}
    />
  );
};

export default RestaurantLogo;
