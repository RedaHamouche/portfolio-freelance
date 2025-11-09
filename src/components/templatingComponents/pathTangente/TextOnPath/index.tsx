import React, { memo, useMemo } from 'react';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import { getPointOnPath, getPathAngleAtProgress, calculateAdaptiveDelta } from '@/utils/pathCalculations';
import { normalizeAngleForReadability, getPerpendicularOffset } from '@/utils/tangentUtils';
import styles from './index.module.scss';

interface TextOnPathProps {
  svgPath: SVGPathElement | null;
  text: string;
  startProgress: number;
  length: number; // Longueur le long du path (en progress 0-1)
  offset: number; // Distance en pixels en dessous du path
  paddingX: number;
  paddingY: number;
  pathLength: number;
}

export const TextOnPath = memo(function TextOnPath({
  svgPath,
  text,
  startProgress,
  length,
  offset,
  paddingX,
  paddingY,
  pathLength,
}: TextOnPathProps) {
  const { mapScale } = useResponsivePath();
  
  // Pré-calculer le delta adaptatif une seule fois (optimisation)
  const adaptiveDelta = useMemo(() => calculateAdaptiveDelta(pathLength), [pathLength]);
  
  // Calculer les positions de chaque lettre le long du path
  const letterPositions = useMemo(() => {
    if (!svgPath || text.length === 0 || pathLength <= 0) return [];
    
    const letters = text.split('');
    const numLetters = letters.length;
    
    // Calculer l'espacement une seule fois
    const spacing = numLetters > 1 ? length / (numLetters - 1) : 0;
    
    // Pré-allouer le tableau pour de meilleures performances
    const positions: Array<{
      letter: string;
      x: number;
      y: number;
      angle: number;
      normalizedAngle: number;
    }> = new Array(numLetters);
    
    // Calculer les positions de chaque lettre
    for (let i = 0; i < numLetters; i++) {
      // Progress de cette lettre (entre startProgress et startProgress + length)
      const letterProgress = startProgress + i * spacing;
      
      // Clamper entre 0 et 1
      const clampedProgress = Math.max(0, Math.min(1, letterProgress));
      
      // Obtenir la position et l'angle sur le path (optimisé: delta pré-calculé)
      const point = getPointOnPath(svgPath, clampedProgress, pathLength);
      const angle = getPathAngleAtProgress(svgPath, clampedProgress, adaptiveDelta, pathLength);
      
      // Normaliser l'angle pour la lisibilité
      const normalizedAngle = normalizeAngleForReadability(angle);
      
      // Calculer la position perpendiculaire (en dessous du path)
      // Utiliser l'angle original pour le calcul de l'offset, pas l'angle normalisé
      const offsetPoint = getPerpendicularOffset(point, angle, offset);
      
      positions[i] = {
        letter: letters[i],
        x: offsetPoint.x + paddingX,
        y: offsetPoint.y + paddingY,
        angle,
        normalizedAngle,
      };
    }
    
    return positions;
  }, [svgPath, text, startProgress, length, offset, paddingX, paddingY, pathLength, adaptiveDelta]);
  
  if (!svgPath || letterPositions.length === 0) return null;

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
            zIndex: 5, // Au-dessus des autres éléments
          }}
        >
          {pos.letter === ' ' ? '\u00A0' : pos.letter}
        </span>
      ))}
    </>
  );
});

