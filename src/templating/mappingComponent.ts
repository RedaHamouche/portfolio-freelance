import dynamic from 'next/dynamic';

const BlackSquare = dynamic(() => import('@/components/BlackSquare'), { ssr: true });
const ProjectsBanner = dynamic(() => import('@/components/ProjectsBanner'), { ssr: true });
const ProjectCard = dynamic(() => import('@/components/ProjectCard'), { ssr: true });
const ResponsiveImage = dynamic(() => import('@/components/ResponsiveImage'), { ssr: true });
const OpenModalButton = dynamic(() => import('@/components/OpenModalButton'), { ssr: true });
const PathDebugger = dynamic(() => import('@/components/PathDebugger'), { ssr: true });
const TitleAboutMe = dynamic(() => import('@/components/TitleAboutMe'), { ssr: true });
const TextOnPathWrapper = dynamic(() => import('@/components/TextOnPathWrapper'), { ssr: true });
// HYGEN_IMPORT_COMPONENT DO_NOT_REMOVE

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mappingComponent: Record<string, React.ComponentType<any>> = {
  BlackSquare,
  ProjectsBanner,
  ProjectCard,
  ResponsiveImage,
  OpenModalButton,
  PathDebugger, 
  TitleAboutMe,
  TextOnPath: TextOnPathWrapper,
  // HYGEN_MAP_COMPONENT DO_NOT_REMOVE
};

export default mappingComponent; 