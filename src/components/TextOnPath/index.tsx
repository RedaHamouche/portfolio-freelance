import React, { memo, useMemo } from 'react';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import { getPointOnPath, getPathAngleAtProgress } from '@/utils/pathCalculations';
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

/**
 * Normalise un angle pour que le texte soit toujours lisible (jamais à l'envers)
 * Même fonction que dans PointTrail
 */
function normalizeAngleForReadability(angle: number): number {
  let normalizedAngle = ((angle % 360) + 360) % 360;
  if (normalizedAngle > 180) {
    normalizedAngle -= 360;
  }
  
  const wasFlipped = normalizedAngle > 90 || normalizedAngle < -90;
  
  if (wasFlipped) {
    normalizedAngle += 180;
    normalizedAngle = ((normalizedAngle % 360) + 360) % 360;
    if (normalizedAngle > 180) {
      normalizedAngle -= 360;
    }
  }
  
  return normalizedAngle;
}

/**
 * Calcule la position perpendiculaire à un point sur le path
 * L'offset est toujours vers le bas (perpendiculaire vers le bas)
 */
function getPerpendicularOffset(
  point: { x: number; y: number },
  angle: number,
  offset: number
): { x: number; y: number } {
  // Convertir l'angle en radians
  const angleRad = (angle * Math.PI) / 180;
  
  // Calculer la direction perpendiculaire
  // Pour obtenir le vecteur perpendiculaire à droite (vers le bas quand le path va vers la droite)
  // On utilise: perp_x = -sin(angle), perp_y = cos(angle)
  // Cela donne toujours un vecteur perpendiculaire pointant vers la droite du path
  const perpX = -Math.sin(angleRad);
  const perpY = Math.cos(angleRad);
  
  return {
    x: point.x + perpX * offset,
    y: point.y + perpY * offset,
  };
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
  
  // Calculer les positions de chaque lettre le long du path
  const letterPositions = useMemo(() => {
    if (!svgPath || text.length === 0 || pathLength <= 0) return [];
    
    const letters = text.split('');
    const positions: Array<{
      letter: string;
      x: number;
      y: number;
      angle: number;
      normalizedAngle: number;
    }> = [];
    
    // Calculer les positions de chaque lettre le long du path
    // On distribue les lettres uniformément le long de la longueur spécifiée
    // Pour éviter la division par zéro, on gère le cas où il n'y a qu'une seule lettre
    const numLetters = letters.length;
    const spacing = numLetters > 1 ? length / (numLetters - 1) : 0;
    
    for (let i = 0; i < numLetters; i++) {
      // Progress de cette lettre (entre startProgress et startProgress + length)
      const letterProgress = startProgress + i * spacing;
      
      // Clamper entre 0 et 1
      const clampedProgress = Math.max(0, Math.min(1, letterProgress));
      
      // Obtenir la position et l'angle sur le path
      const point = getPointOnPath(svgPath, clampedProgress, pathLength);
      const angle = getPathAngleAtProgress(svgPath, clampedProgress, 1, pathLength);
      
      // Normaliser l'angle pour la lisibilité
      const normalizedAngle = normalizeAngleForReadability(angle);
      
      // Calculer la position perpendiculaire (en dessous du path)
      // Utiliser l'angle original pour le calcul de l'offset, pas l'angle normalisé
      const offsetPoint = getPerpendicularOffset(point, angle, offset);
      
      positions.push({
        letter: letters[i],
        x: offsetPoint.x + paddingX,
        y: offsetPoint.y + paddingY,
        angle,
        normalizedAngle,
      });
    }
    
    return positions;
  }, [svgPath, text, startProgress, length, offset, paddingX, paddingY, pathLength]);
  
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

