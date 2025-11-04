/**
 * Composant React pour le domaine Tangente
 * Utilise l'API du domaine Tangente pour rendre les composants
 */

"use client"
import React, { useMemo } from 'react';
import mappingComponent from '../mappingComponent';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { createTangenteDomain } from '../domains/tangente';

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

  // Créer une instance du domaine Tangente
  const tangenteDomain = useMemo(() => createTangenteDomain(), []);

  // Récupérer tous les composants via l'API du domaine
  const tangenteComponents = useMemo(() => tangenteDomain.getAllComponents(), [tangenteDomain]);

  if (!svgPath || tangenteComponents.length === 0 || pathLength <= 0) return null;

  return (
    <>
      {tangenteComponents.map((component) => {
        const Comp = mappingComponent[component.type];
        if (!Comp) return null;

        return (
          <Comp
            key={component.id}
            {...component}
            svgPath={svgPath}
            paddingX={paddingX}
            paddingY={paddingY}
            pathLength={pathLength}
          />
        );
      })}
    </>
  );
}

