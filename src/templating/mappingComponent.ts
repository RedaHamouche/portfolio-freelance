import dynamic from 'next/dynamic';

const BlackSquare = dynamic(() => import('@/components/apiComponents/BlackSquare'), { ssr: true });
const ProjectsBanner = dynamic(() => import('@/components/apiComponents/ProjectsBanner'), { ssr: true });
const ProjectCard = dynamic(() => import('@/components/apiComponents/ProjectCard'), { ssr: true });
const ResponsiveImage = dynamic(() => import('@/components/apiComponents/ResponsiveImage'), { ssr: true });
const OpenModalButton = dynamic(() => import('@/components/apiComponents/OpenModalButton'), { ssr: true });
const PathDebugger = dynamic(() => import('@/components/apiComponents/PathDebugger'), { ssr: true });
const TitleAboutMe = dynamic(() => import('@/components/apiComponents/TitleAboutMe'), { ssr: true });
const TextOnCircle = dynamic(() => import('@/components/apiComponents/TextOnCircle'), { ssr: true });
const PieceOfArt = dynamic(() => import('@/components/apiComponents/PieceOfArt'), { ssr: true });
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
  TextOnCircle,
  PieceOfArt, 
  // HYGEN_MAP_COMPONENT DO_NOT_REMOVE
};

export default mappingComponent; 