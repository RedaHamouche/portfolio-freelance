type DynamicProps = {
  mapWidth: number;
  mapHeight: number;
};

import mappingComponent from './mappingComponent';
import config from './page.json';

export default function Dynamic({ mapWidth, mapHeight }: DynamicProps) {
  if (!config.components) return null;
  return (
    <>
      {config.components.map((item, idx) => {
        const Comp = mappingComponent[item.type];
        if (!Comp) return null;
        const { position, ...rest } = item;
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              top: position?.top,
              left: position?.left,
              pointerEvents: 'auto',
            }}
          >
            <Comp {...rest} mapWidth={mapWidth} mapHeight={mapHeight} />
          </div>
        );
      })}
    </>
  );
} 