import dynamic from 'next/dynamic';

// Composants critiques (contenu important, SEO) - SSR activé
const BlackSquare = dynamic(() => import('@/components/templatingComponents/page/BlackSquare'), { ssr: true });
const ProjectsBanner = dynamic(() => import('@/components/templatingComponents/path/ProjectsBanner'), { ssr: true });
const ProjectCard = dynamic(() => import('@/components/templatingComponents/path/ProjectCard'), { ssr: true });
const ResponsiveImage = dynamic(() => import('@/components/templatingComponents/path/ResponsiveImage'), { ssr: true });
const TitleAboutMe = dynamic(() => import('@/components/templatingComponents/pathTangente/TitleAboutMe'), { ssr: true });

// Composants non critiques (interactions, debug) - SSR désactivé pour code splitting
const OpenModalButton = dynamic(() => import('@/components/templatingComponents/path/OpenModalButton'), { ssr: false });
const PathDebugger = dynamic(() => import('@/components/templatingComponents/path/PathDebugger'), { ssr: false });
const TextOnCircle = dynamic(() => import('@/components/templatingComponents/pathTangente/TextOnCircle'), { ssr: false });
const PieceOfArt = dynamic(() => import('@/components/templatingComponents/path/PieceOfArt'), { ssr: false });
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