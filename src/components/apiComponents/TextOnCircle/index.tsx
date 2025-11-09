import React, { memo, useMemo } from 'react';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import { normalizeAngleForReadability, getPointOnCircle } from '@/utils/tangentUtils';
import styles from './index.module.scss';

interface TextOnCircleProps {
  text: string;
  centerX: number;
  centerY: number;
  radius: number;
  startAngle?: number; // Angle de départ en degrés (0 = droite, 90 = bas)
  direction?: 'clockwise' | 'counterclockwise'; // Direction du texte autour du cercle
  letterSpacing?: number; // Espacement entre les lettres en degrés (auto si non fourni)
}

const TextOnCircle = memo(function TextOnCircle({
  text,
  centerX,
  centerY,
  radius,
  startAngle = 0,
  direction = 'clockwise',
  letterSpacing,
}: TextOnCircleProps) {
  const { mapScale } = useResponsivePath();
  
  // Calculer les positions de chaque lettre autour du cercle
  const letterPositions = useMemo(() => {
    if (!text || text.length === 0 || radius <= 0) return [];
    
    const letters = text.split('');
    const numLetters = letters.length;
    
    // Calculer l'espacement automatique si non fourni
    // On distribue le texte sur 360 degrés (cercle complet)
    const totalAngle = letterSpacing 
      ? letterSpacing * (numLetters - 1)
      : 360; // Par défaut, distribuer sur tout le cercle
    
    // Calculer l'angle de départ en fonction de la direction
    // Pour clockwise, on commence à startAngle et on augmente
    // Pour counterclockwise, on commence à startAngle et on diminue
    const angleStep = direction === 'clockwise' 
      ? totalAngle / Math.max(1, numLetters - 1)
      : -totalAngle / Math.max(1, numLetters - 1);
    
    // Pré-allouer le tableau pour de meilleures performances
    const positions: Array<{
      letter: string;
      x: number;
      y: number;
      angle: number;
      normalizedAngle: number;
    }> = new Array(numLetters);
    
    for (let i = 0; i < numLetters; i++) {
      // Calculer l'angle pour cette lettre
      const angle = startAngle + i * angleStep;
      
      // Obtenir la position sur le cercle
      const point = getPointOnCircle(centerX, centerY, radius, angle);
      
      // Pour un cercle, l'angle de la tangente est angle + 90° (perpendiculaire au rayon)
      // L'angle de rotation du texte est l'angle de la tangente
      const tangentAngle = angle + 90;
      const normalizedAngle = normalizeAngleForReadability(tangentAngle);
      
      positions[i] = {
        letter: letters[i],
        x: point.x,
        y: point.y,
        angle: tangentAngle,
        normalizedAngle,
      };
    }
    
    return positions;
  }, [text, centerX, centerY, radius, startAngle, direction, letterSpacing]);
  
  if (!text || letterPositions.length === 0) return null;

  return (
    <>
      {letterPositions.map((pos, index) => (
        <span
          key={`${pos.letter}-${index}`}
          className={styles.letter}
          style={{
            position: 'absolute',
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            transform: `translate(-50%, -50%) scale(${1 / mapScale}) rotate(${pos.normalizedAngle}deg)`,
            transformOrigin: 'center',
            zIndex: 5,
          }}
        >
          {pos.letter === ' ' ? '\u00A0' : pos.letter}
        </span>
      ))}
    </>
  );
});

export default TextOnCircle;

