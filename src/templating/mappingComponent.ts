import dynamic from 'next/dynamic';

const BlackSquare = dynamic(() => import('@/components/BlackSquare'), { ssr: true });
const ProjectsBanner = dynamic(() => import('@/components/ProjectsBanner'), { ssr: true });
const ProjectCard = dynamic(() => import('@/components/ProjectCard'), { ssr: true });
const ResponsiveImage = dynamic(() => import('@/components/ResponsiveImage'), { ssr: true });
const OpenModalButton = dynamic(() => import('@/components/OpenModalButton'), { ssr: true });
import PathDebugger from '@/components/PathDebugger'; 
// HYGEN_IMPORT_COMPONENT DO_NOT_REMOVE

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mappingComponent: Record<string, React.ComponentType<any>> = {
  BlackSquare,
  ProjectsBanner,
  ProjectCard,
  ResponsiveImage,
  OpenModalButton,
  PathDebugger, 
  // HYGEN_MAP_COMPONENT DO_NOT_REMOVE
};

export default mappingComponent; 