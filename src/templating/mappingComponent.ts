import dynamic from 'next/dynamic';

const BlackSquare = dynamic(() => import('@/components/BlackSquare'), { ssr: true });
const ProjectsBanner = dynamic(() => import('@/components/ProjectsBanner'), { ssr: true });
// HYGEN_IMPORT_COMPONENT DO_NOT_REMOVE

const mappingComponent: Record<string, React.ComponentType<Record<string, unknown>>> = {
  BlackSquare,
  ProjectsBanner,
  // HYGEN_MAP_COMPONENT DO_NOT_REMOVE
};

export default mappingComponent; 