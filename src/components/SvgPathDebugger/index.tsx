'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import { getPointOnPath } from '@/utils/pathCalculations';
import { createPathDomain } from '@/templating/domains/path';
import styles from './index.module.scss';

interface SvgPathDebuggerProps {
  svgPath: SVGPathElement | null;
  paddingX: number;
  paddingY: number;
}

export const SvgPathDebugger: React.FC<SvgPathDebuggerProps> = ({
  svgPath,
  paddingX,
  paddingY,
}) => {
  const progress = useSelector((state: RootState) => state.scroll.progress);
  const { svgSize } = useResponsivePath();
  // OPTIMISATION: Déterminer isDesktop une seule fois au chargement (pas de resize)
  const isDesktop = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024; // Desktop breakpoint
  }, []);
  const [showDebug, setShowDebug] = useState(false);
  const [showPoints, setShowPoints] = useState(true);
  const [showAnchors, setShowAnchors] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Créer une instance du domaine Path
  const pathDomain = useMemo(() => createPathDomain(), []);

  // Vérifier si le mode debug est activé
  useEffect(() => {
    const isDebugMode =
      typeof window !== 'undefined' &&
      (window.location.search.includes('debug=true') ||
        process.env.NEXT_PUBLIC_ENABLE_SVG_DEBUG === 'true' ||
        process.env.NODE_ENV === 'development');
    setShowDebug(isDebugMode);
    setMounted(true);
  }, []);

  // Mémoïser pathLength et currentPoint pour éviter les recalculs
  // IMPORTANT: Les hooks doivent être appelés avant tout return conditionnel
  const pathLength = useMemo(() => {
    if (!svgPath) return 0;
    return svgPath.getTotalLength();
  }, [svgPath]);
  
  const currentPoint = useMemo(() => {
    if (!svgPath) return { x: 0, y: 0 };
    // Passer pathLength pour éviter les recalculs de getTotalLength()
    return getPointOnPath(svgPath, progress, pathLength);
  }, [svgPath, progress, pathLength]);

  // Mémoïser les points de contrôle - ils ne changent que si svgPath change
  const controlPoints = useMemo(() => {
    if (!svgPath) return [];
    const points: Array<{ x: number; y: number; progress: number }> = [];
    // Passer pathLength pour éviter les recalculs de getTotalLength()
    for (let i = 0; i <= 20; i++) {
      const prog = i / 20;
      const point = getPointOnPath(svgPath, prog, pathLength);
      points.push({ x: point.x, y: point.y, progress: prog });
    }
    return points;
  }, [svgPath, pathLength]);

  // Early return après tous les hooks
  if (!showDebug || !svgPath || !mounted) return null;

  // Panel de contrôle rendu via portal en dehors du SVG
  const controlPanel = (
    <div className={styles.controlPanel}>
      <h4>SVG Path Debugger</h4>
      <div className={styles.controls}>
        <label>
          <input
            type="checkbox"
            checked={showPoints}
            onChange={(e) => setShowPoints(e.target.checked)}
          />
          Points de contrôle
        </label>
        <label>
          <input
            type="checkbox"
            checked={showAnchors}
            onChange={(e) => setShowAnchors(e.target.checked)}
          />
          Ancres (components)
        </label>
        <label>
          <input
            type="checkbox"
            checked={showInfo}
            onChange={(e) => setShowInfo(e.target.checked)}
          />
          Informations
        </label>
      </div>
      {showInfo && (
        <div className={styles.info}>
          <p>
            <strong>Progress:</strong> {(progress * 100).toFixed(2)}%
          </p>
          <p>
            <strong>Longueur path:</strong> {pathLength.toFixed(2)}px
          </p>
          <p>
            <strong>Position actuelle:</strong> X:{currentPoint.x.toFixed(0)}, Y:
            {currentPoint.y.toFixed(0)}
          </p>
          <p>
            <strong>SVG Size:</strong> {svgSize.width} x {svgSize.height}
          </p>
        </div>
      )}
    </div>
  );

  return null

  return (
    <>
      {/* Panel de contrôle rendu via portal en dehors du SVG */}
      {typeof window !== 'undefined' &&
        createPortal(controlPanel, document.body)}

      {/* Points de contrôle sur le path */}
      {showPoints && (
        <g className={styles.controlPoints}>
          {controlPoints.map((point, index) => (
            <circle
              key={`control-${index}`}
              cx={point.x + paddingX}
              cy={point.y + paddingY}
              r={3}
              fill="#ff6b6b"
              opacity={0.6}
            />
          ))}
        </g>
      )}

      {/* Point actuel */}
      <g className={styles.currentPoint}>
        <circle
          cx={currentPoint.x + paddingX}
          cy={currentPoint.y + paddingY}
          r={8}
          fill="#4ecdc4"
          stroke="#fff"
          strokeWidth={2}
        />
        <circle
          cx={currentPoint.x + paddingX}
          cy={currentPoint.y + paddingY}
          r={12}
          fill="none"
          stroke="#4ecdc4"
          strokeWidth={2}
          opacity={0.5}
          className={styles.pulse}
        />
      </g>

      {/* Ancres (composants) */}
      {showAnchors && svgPath && (
        <g className={styles.anchors}>
          {pathDomain.getAllComponents(isDesktop).map((component) => {
            if (!svgPath) return null;
            const anchorPoint = getPointOnPath(
              svgPath,
              component.position.progress,
              pathLength
            );
            return (
              <g key={component.id}>
                <circle
                  cx={anchorPoint.x + paddingX}
                  cy={anchorPoint.y + paddingY}
                  r={6}
                  fill="#95e1d3"
                  stroke="#fff"
                  strokeWidth={2}
                />
                <text
                  x={anchorPoint.x + paddingX + 10}
                  y={anchorPoint.y + paddingY}
                  fill="#333"
                  fontSize="12"
                  className={styles.anchorLabel}
                >
                  {component.displayName} ({component.position.progress})
                </text>
              </g>
            );
          })}
        </g>
      )}
    </>
  );
};

