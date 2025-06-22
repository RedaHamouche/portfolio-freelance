import React from 'react';

const BlackSquare = React.lazy(() => import('@/components/BlackSquare'));
const ProjectsBanner = React.lazy(() => import('@/components/ProjectsBanner'));
// HYGEN_IMPORT_COMPONENT DO_NOT_REMOVE

const mappingComponent: Record<string, React.ComponentType<Record<string, unknown>>> = {
  BlackSquare,
  ProjectsBanner,
  // HYGEN_MAP_COMPONENT DO_NOT_REMOVE
};

export default mappingComponent; 