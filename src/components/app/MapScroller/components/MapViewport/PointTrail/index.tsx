import React, { memo, useMemo } from 'react';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import styles from './index.module.scss';
import classnames from 'classnames';

interface PathComponentData {
  id: string;
  type: string;
  displayName: string;
  anchorId: string;
  position: {
    progress: number;
  };
  autoScrollPauseTime?: number;
}

interface PointTrailProps {
  x: number;
  y: number;
  nextComponent: PathComponentData | null;
  onGoToNext: () => void;
  angle: number;
  arrowPosition: 'left' | 'right';
}

/**
 * Normalise un angle pour que le texte soit toujours lisible (jamais à l'envers)
 * Si l'angle est entre 90° et 270° (ou -90° et -270°), on ajoute 180° pour le retourner
 * @returns Un objet avec l'angle normalisé et un booléen indiquant si l'angle a été retourné
 */
function normalizeAngleForReadability(angle: number): { normalizedAngle: number; wasFlipped: boolean } {
  // Normaliser l'angle entre -180° et 180°
  let normalizedAngle = ((angle % 360) + 360) % 360;
  if (normalizedAngle > 180) {
    normalizedAngle -= 360;
  }
  
  // Si l'angle est entre 90° et -90° (ou -90° et 90°), le texte est lisible
  // Sinon, on ajoute 180° pour le retourner
  const wasFlipped = normalizedAngle > 90 || normalizedAngle < -90;
  
  if (wasFlipped) {
    normalizedAngle += 180;
    // Re-normaliser après l'ajout
    normalizedAngle = ((normalizedAngle % 360) + 360) % 360;
    if (normalizedAngle > 180) {
      normalizedAngle -= 360;
    }
  }
  
  return { normalizedAngle, wasFlipped };
}

/**
 * Calcule la position de la flèche en tenant compte de la normalisation de l'angle
 * Si l'angle a été retourné, on inverse la position de la flèche
 */
function calculateNormalizedArrowPosition(
  originalArrowPosition: 'left' | 'right',
  wasFlipped: boolean
): 'left' | 'right' {
  if (wasFlipped) {
    // Si l'angle a été retourné, on inverse la position de la flèche
    return originalArrowPosition === 'left' ? 'right' : 'left';
  }
  return originalArrowPosition;
}

const PointTrail = memo(function PointTrail({
  x,
  y,
  nextComponent,
  onGoToNext,
  angle,
  arrowPosition
}: PointTrailProps) {
  const { mapScale } = useResponsivePath();
  
  // Normaliser l'angle pour que le texte soit toujours lisible
  const { normalizedAngle, wasFlipped } = useMemo(
    () => normalizeAngleForReadability(angle),
    [angle]
  );
  
  // Calculer la position normalisée de la flèche
  const normalizedArrowPosition = useMemo(
    () => calculateNormalizedArrowPosition(arrowPosition, wasFlipped),
    [arrowPosition, wasFlipped]
  );
  
  // Calculer le translate pour éviter les reflows (plus performant que top/left)
  const translateX = x;
  const translateY = y;
  const scale = 1 / mapScale;

  return (
    <button
      type="button"
      className={classnames(styles.pointContainer, styles[`position-${normalizedArrowPosition}`])}
      style={{
        // Utiliser transform au lieu de top/left pour éviter les reflows et réduire le CLS
        transform: `translate(calc(${translateX}px - 50%), calc(${translateY}px - 50%)) scale(${scale}) rotate(${normalizedAngle}deg)`,
        transformOrigin: 'center',
      }}
      onClick={onGoToNext}
      tabIndex={0}
      aria-label={nextComponent ? `Aller à ${nextComponent.displayName}` : 'Aller au prochain composant'}
    >
      <span className={styles.nextComponentText} title={nextComponent?.displayName}>
        {nextComponent?.displayName}
      </span>
      <div className={styles.arrowContainer}>
        <svg
          className={styles.arrow}
          xmlns="http://www.w3.org/2000/svg"
          width={14}
          height={15}
          aria-hidden="true"
        >
          <path
            className={styles.path}
            fill="#F6F6F6"
            strokeDasharray="20 10"
            d="m6.318 14.23 7.212-6.228a.6.6 0 0 0 0-.906L6.318.869a.15.15 0 0 0-.249.113v1.52c0 .086.038.169.104.227l4.757 4.108H.313a.15.15 0 0 0-.151.15v1.126c0 .082.068.15.15.15H10.93L6.173 12.37a.3.3 0 0 0-.104.227v1.52c0 .127.151.197.25.112"
          />
        </svg>
      </div>
    </button>
  );
});

export default PointTrail;

