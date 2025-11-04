/**
 * Composant React pour le domaine Tangente
 * Utilise l'API du domaine Tangente pour rendre les composants alignés sur le path SVG
 * Gère automatiquement le positionnement de tous les composants
 */

"use client"
import React, { useMemo } from 'react';
import mappingComponent from '../mappingComponent';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { createTangenteDomain } from '../domains/tangente';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import { useBreakpoint } from '@/hooks/useBreakpointValue';
import { getPointOnPath, getPathAngleAtProgress } from '@/utils/pathCalculations';

interface DynamicPathTangenteComponentsProps {
  svgPath: SVGPathElement | null;
  paddingX: number;
  paddingY: number;
}

/**
 * Normalise un angle pour que le texte soit toujours lisible (jamais à l'envers)
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
 */
function getPerpendicularOffset(
  point: { x: number; y: number },
  angle: number,
  offset: number
): { x: number; y: number } {
  const angleRad = (angle * Math.PI) / 180;
  const perpX = -Math.sin(angleRad);
  const perpY = Math.cos(angleRad);
  
  return {
    x: point.x + perpX * offset,
    y: point.y + perpY * offset,
  };
}

export default function DynamicPathTangenteComponents({ 
  svgPath, 
  paddingX, 
  paddingY 
}: DynamicPathTangenteComponentsProps) {
  const pathLength = useSelector((state: RootState) => state.scroll.pathLength);
  const { mapScale } = useResponsivePath();
  const isDesktop = useBreakpoint('>=desktop');

  // Créer une instance du domaine Tangente
  const tangenteDomain = useMemo(() => createTangenteDomain(), []);

  // Récupérer tous les composants via l'API du domaine selon le breakpoint
  const tangenteComponents = useMemo(() => tangenteDomain.getAllComponents(isDesktop), [tangenteDomain, isDesktop]);

  // Calculer les positions et angles pour chaque composant
  const componentPositions = useMemo(() => {
    if (!svgPath || pathLength <= 0) return [];

    return tangenteComponents.map((component) => {
      // Utiliser l'API du domaine pour récupérer les valeurs
      const startProgress = tangenteDomain.getComponentPosition(component);
      const offset = tangenteDomain.getComponentOffset(component);
      
      // Clamper le progress entre 0 et 1
      const clampedProgress = Math.max(0, Math.min(1, startProgress));
      
      // Obtenir la position et l'angle sur le path
      const point = getPointOnPath(svgPath, clampedProgress, pathLength);
      const angle = getPathAngleAtProgress(svgPath, clampedProgress, 1, pathLength);
      
      // Normaliser l'angle pour la lisibilité
      const normalizedAngle = normalizeAngleForReadability(angle);
      
      // Calculer la position perpendiculaire (en dessous du path)
      const offsetPoint = getPerpendicularOffset(point, angle, offset);
      
      return {
        x: offsetPoint.x + paddingX,
        y: offsetPoint.y + paddingY,
        angle: normalizedAngle,
      };
    });
  }, [svgPath, pathLength, tangenteComponents, paddingX, paddingY, tangenteDomain]);

  if (!svgPath || tangenteComponents.length === 0 || pathLength <= 0) return null;

  return (
    <>
      {tangenteComponents.map((component, index) => {
        const Comp = mappingComponent[component.type];
        if (!Comp) return null;

        const position = componentPositions[index];
        
        // Extraire les props de position pour ne pas les passer au composant
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { position: _, offset: __, ...componentProps } = component;

        // TextOnPath est un cas spécial : il positionne les lettres individuellement
        // Il a besoin d'accéder au path directement, donc on lui passe les props nécessaires
        const isTextOnPath = component.type === 'TextOnPath';
        
        if (isTextOnPath) {
          // Pour TextOnPath, utiliser l'API du domaine pour obtenir les props selon le breakpoint
          const textOnPathProps = tangenteDomain.getTextOnPathProps(component);
          if (!textOnPathProps) return null;
          
          return (
            <Comp
              key={component.id}
              {...componentProps}
              {...textOnPathProps}
              svgPath={svgPath}
              paddingX={paddingX}
              paddingY={paddingY}
              pathLength={pathLength}
            />
          );
        }

        // Pour tous les autres composants, on gère le positionnement automatiquement
        // Passer le startProgress du composant pour que les animations puissent se déclencher relativement
        const componentStartProgress = tangenteDomain.getComponentPosition(component);
        
        return (
          <div
            key={component.id}
            style={{
              position: 'absolute',
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: `translate(-50%, -50%) scale(${1 / mapScale}) rotate(${position.angle}deg)`,
              transformOrigin: 'center',
              zIndex: 10,
            }}
          >
            <Comp {...componentProps} componentProgress={componentStartProgress} />
          </div>
        );
      })}
    </>
  );
}

