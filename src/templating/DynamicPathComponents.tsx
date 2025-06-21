import React from 'react';
import mappingComponent from './mappingComponent';
import pathComponents from './pathComponents.json';

interface DynamicPathComponentsProps {
  pathRef: React.RefObject<SVGPathElement | null>;
  mapWidth: number;
  mapHeight: number;
}

interface PathComponent {
  id: string;
  type: string;
  displayName: string;
  position: {
    progress: number;
    start: number;
    end: number;
  };
}

export default function DynamicPathComponents({ pathRef, mapWidth, mapHeight }: DynamicPathComponentsProps) {
  if (!pathRef.current || !pathComponents) return null;

  const getPositionOnPath = (progress: number) => {
    const path = pathRef.current;
    if (!path) return { x: 0, y: 0 };
    
    const totalLength = path.getTotalLength();
    const position = path.getPointAtLength(progress * totalLength);
    return { x: position.x, y: position.y };
  };

  return (
    <>
      {pathComponents.map((component: PathComponent) => {
        const Comp = mappingComponent[component.type];
        if (!Comp) return null;

        const position = getPositionOnPath(component.position.progress);
        
        return (
          <div
            key={component.id}
            style={{
              position: 'absolute',
              top: position.y,
              left: position.x,
              transform: 'translate(-50%, -50%)', // Centrer le composant sur le point
              pointerEvents: 'auto',
              zIndex: 10,
            }}
          >
            <Comp 
              {...component} 
              mapWidth={mapWidth} 
              mapHeight={mapHeight}
            />
          </div>
        );
      })}
    </>
  );
} 