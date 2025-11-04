import React, { memo } from 'react';
import { TextOnPath } from '@/components/TextOnPath';

interface TextOnPathWrapperProps {
  text?: string;
  position?: {
    startProgress?: number;
    length?: number;
    progress?: number; // Alias pour startProgress si length n'est pas défini
  };
  offset?: number;
  // Ces props seront injectées par DynamicPathComponents
  svgPath?: SVGPathElement | null;
  paddingX?: number;
  paddingY?: number;
  pathLength?: number;
  [key: string]: unknown; // Pour accepter toutes les autres props passées par le mapping
}

/**
 * Wrapper pour TextOnPath qui peut être utilisé dans le mapping des composants
 * Les props svgPath, paddingX, paddingY, pathLength sont injectées par DynamicPathComponents
 */
const TextOnPathWrapper = memo(function TextOnPathWrapper({
  text,
  position,
  offset = 40,
  svgPath,
  paddingX = 0,
  paddingY = 0,
  pathLength = 0,
}: TextOnPathWrapperProps) {
  // Extraire les props nécessaires
  const startProgress = position?.startProgress ?? position?.progress ?? 0.5;
  const length = position?.length ?? 0.1;

  if (!text || !svgPath || pathLength <= 0) return null;

  return (
    <TextOnPath
      svgPath={svgPath}
      text={text}
      startProgress={startProgress}
      length={length}
      offset={offset}
      paddingX={paddingX}
      paddingY={paddingY}
      pathLength={pathLength}
    />
  );
});

export default TextOnPathWrapper;

