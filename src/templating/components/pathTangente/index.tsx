/**
 * Composant React pour le domaine Tangente
 * Utilise l'API du domaine Tangente pour rendre les composants alignés sur le path SVG
 * Gère automatiquement le positionnement de tous les composants
 */

"use client"
import React, { useMemo, useRef } from 'react';
import mappingComponent from '@/templating/mappingComponent';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useTemplatingContext } from '@/contexts/TemplatingContext';
import { useResponsivePath } from '@/hooks/useResponsivePath';
import { getPointOnPath, getPathAngleAtProgress, calculateAdaptiveDelta } from '@/utils/pathCalculations';
import { normalizeAngleForReadability, getPerpendicularOffset } from '@/utils/tangentUtils';

interface DynamicPathTangenteComponentsProps {
  svgPath: SVGPathElement | null;
  paddingX: number;
  paddingY: number;
}


export default function DynamicPathTangenteComponents({ 
  svgPath, 
  paddingX, 
  paddingY 
}: DynamicPathTangenteComponentsProps) {
  const pathLength = useSelector((state: RootState) => state.scroll.pathLength);
  const { mapScale } = useResponsivePath();
  // OPTIMISATION: Déterminer isDesktop une seule fois au chargement (pas de resize)
  const isDesktop = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024; // Desktop breakpoint
  }, []);

  // Utiliser le domaine Tangente depuis le context (source unique de vérité)
  const { tangenteDomain } = useTemplatingContext();

  // Récupérer tous les composants via l'API du domaine selon le breakpoint
  const tangenteComponents = useMemo(() => tangenteDomain.getAllComponents(isDesktop), [tangenteDomain, isDesktop]);

  // Pré-calculer le delta adaptatif une seule fois (optimisation)
  const adaptiveDelta = useMemo(() => calculateAdaptiveDelta(pathLength), [pathLength]);
  
  // OPTIMISATION: Cache pour les positions des composants tangente
  // Les positions ne dépendent pas du progress (elles sont fixes dans le JSON)
  // Mais on cache quand même pour éviter les recalculs si les dépendances n'ont pas changé
  const lastCalculationKeyRef = useRef<string | null>(null);
  const cachedPositionsRef = useRef<Array<{ x: number; y: number; angle: number }>>([]);
  
  // Calculer les positions et angles pour chaque composant
  const componentPositions = useMemo(() => {
    if (!svgPath || pathLength <= 0) return [];

    // Créer une clé de cache basée sur les dépendances
    // Les positions ne changent que si ces valeurs changent
    const calculationKey = `${svgPath ? 'path' : 'nopath'}-${pathLength}-${tangenteComponents.length}-${paddingX}-${paddingY}-${adaptiveDelta}`;
    
    // Si la clé n'a pas changé, utiliser le cache
    if (lastCalculationKeyRef.current === calculationKey && cachedPositionsRef.current.length > 0) {
      return cachedPositionsRef.current;
    }

    // Pré-allouer le tableau pour de meilleures performances
    const positions = new Array(tangenteComponents.length);
    
    for (let i = 0; i < tangenteComponents.length; i++) {
      const component = tangenteComponents[i];
      
      // Utiliser l'API du domaine pour récupérer les valeurs
      const startProgress = tangenteDomain.getComponentPosition(component);
      const offset = tangenteDomain.getComponentOffset(component);
      
      // Clamper le progress entre 0 et 1
      const clampedProgress = Math.max(0, Math.min(1, startProgress));
      
      // Obtenir la position sur le path
      const point = getPointOnPath(svgPath, clampedProgress, pathLength);
      
      // Calculer l'angle (delta pré-calculé)
      const angle = getPathAngleAtProgress(svgPath, clampedProgress, adaptiveDelta, pathLength);
      
      // Normaliser l'angle pour la lisibilité
      const normalizedAngle = normalizeAngleForReadability(angle);
      
      // Calculer la position perpendiculaire (en dessous du path)
      // Utiliser l'angle original (non normalisé) pour le calcul de l'offset
      const offsetPoint = getPerpendicularOffset(point, angle, offset);
      
      positions[i] = {
        x: offsetPoint.x + paddingX,
        y: offsetPoint.y + paddingY,
        angle: normalizedAngle,
      };
    }
    
    // Mettre à jour le cache
    cachedPositionsRef.current = positions;
    lastCalculationKeyRef.current = calculationKey;
    
    return positions;
  }, [svgPath, pathLength, tangenteComponents, paddingX, paddingY, tangenteDomain, adaptiveDelta]);

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

