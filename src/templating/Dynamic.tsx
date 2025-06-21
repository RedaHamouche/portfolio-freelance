import React from 'react';
import mappingComponent from './mappingComponent';
import config from './page.json';

type DynamicProps = Record<string, never>;

export default function Dynamic({}: DynamicProps) {
  if (!config.components) return null;
  return (
    <>
      {config.components.map((item, idx) => {
        const Comp = mappingComponent[item.type];
        if (!Comp) return null;
        const { position, ...rest } = item;
        const componentProps = {
          ...rest
        };
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
            <Comp {...componentProps} />
          </div>
        );
      })}
    </>
  );
} 