import dynamic from 'next/dynamic';

const BlackSquare = dynamic(() => import('@/components/templatingComponents/page/BlackSquare'), { ssr: true });
const ProjectsBanner = dynamic(() => import('@/components/templatingComponents/path/ProjectsBanner'), { ssr: true });
const ProjectCard = dynamic(() => import('@/components/templatingComponents/path/ProjectCard'), { ssr: true });
const ResponsiveImage = dynamic(() => import('@/components/templatingComponents/path/ResponsiveImage'), { ssr: true });
const OpenModalButton = dynamic(() => import('@/components/templatingComponents/path/OpenModalButton'), { ssr: true });
const PathDebugger = dynamic(() => import('@/components/templatingComponents/path/PathDebugger'), { ssr: true });
const TitleAboutMe = dynamic(() => import('@/components/templatingComponents/pathTangente/TitleAboutMe'), { ssr: true });
const TextOnCircle = dynamic(() => import('@/components/templatingComponents/pathTangente/TextOnCircle'), { ssr: true });
const PieceOfArt = dynamic(() => import('@/components/templatingComponents/path/PieceOfArt'), { ssr: true });
const Test1 = dynamic(() => import('@/components/templatingComponents/page/Test1'), { ssr: true });

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
  Test1,

  // HYGEN_MAP_COMPONENT DO_NOT_REMOVE
};

export default mappingComponent; 