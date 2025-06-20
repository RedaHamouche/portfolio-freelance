import React from 'react';

interface BlackSquareProps {
  mapWidth: number;
  mapHeight: number;
}

const SQUARE_SIZE = 2000;

const BlackSquare: React.FC<BlackSquareProps> = ({ mapWidth, mapHeight }) => {
  // Calculer la position pour centrer le carré sur la map
  const left = 1000
  const top = 2000

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        background: 'black',
        zIndex: 10,
      }}
    />
  );
};

export default BlackSquare; 