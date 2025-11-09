/**
 * Génère tous les placeholders blur pour les images dans les configs
 * Extrait les images depuis les composants et génère les placeholders
 */

import type { ServerConfigs } from './loadServerConfigs';
import {
  generatePlaceholdersForImage,
  generatePlaceholdersForResponsiveImage,
} from './generateImagePlaceholders';

/**
 * Map des placeholders par ID de composant
 * Structure: { componentId: { blurDataURL, mobileBlurDataURL, desktopBlurDataURL } }
 */
export interface ImagePlaceholdersMap {
  [componentId: string]: {
    blurDataURL?: string;
    mobileBlurDataURL?: string;
    desktopBlurDataURL?: string;
  };
}

/**
 * Extrait les images d'un composant Path (PieceOfArt, ResponsiveImage, etc.)
 */
function extractImagesFromPathComponent(component: {
  id: string;
  type: string;
  [key: string]: unknown;
}): {
  id: string;
  src?: string;
  mobileSrc?: string;
  desktopSrc?: string;
  responsiveSrc?: { mobile: string; desktop: string };
} | null {
  // PieceOfArt : src, mobileSrc, desktopSrc
  if (component.type === 'PieceOfArt') {
    return {
      id: component.id,
      src: component.src as string | undefined,
      mobileSrc: component.mobileSrc as string | undefined,
      desktopSrc: component.desktopSrc as string | undefined,
    };
  }

  // ResponsiveImage : src.mobile, src.desktop
  if (component.type === 'ResponsiveImage') {
    const src = component.src as { mobile?: string; desktop?: string } | undefined;
    if (src && src.mobile && src.desktop) {
      return {
        id: component.id,
        responsiveSrc: {
          mobile: src.mobile,
          desktop: src.desktop,
        },
      };
    }
  }

  return null;
}

/**
 * Génère tous les placeholders pour les images dans les configs
 */
export async function generateAllImagePlaceholders(
  configs: ServerConfigs
): Promise<ImagePlaceholdersMap> {
  const placeholdersMap: ImagePlaceholdersMap = {};

  // Extraire les images des composants Path (desktop et mobile)
  const allPathComponents = [
    ...configs.path.desktop,
    ...configs.path.mobile,
  ];

  // Traiter chaque composant
  for (const component of allPathComponents) {
    const imageData = extractImagesFromPathComponent(component);

    if (!imageData) {
      continue;
    }

    // Générer les placeholders selon le type d'image
    if (imageData.responsiveSrc) {
      // ResponsiveImage
      const placeholders = await generatePlaceholdersForResponsiveImage(
        imageData.responsiveSrc
      );
      if (placeholders.mobileBlurDataURL || placeholders.desktopBlurDataURL) {
        placeholdersMap[imageData.id] = placeholders;
      }
    } else {
      // PieceOfArt ou autre avec src/mobileSrc/desktopSrc
      const placeholders = await generatePlaceholdersForImage(
        imageData.src,
        imageData.mobileSrc,
        imageData.desktopSrc
      );

      // Déterminer quel blurDataURL utiliser selon la source
      // Priorité : desktopBlurDataURL > mobileBlurDataURL > blurDataURL
      if (placeholders.desktopBlurDataURL) {
        placeholdersMap[imageData.id] = {
          blurDataURL: placeholders.desktopBlurDataURL,
          mobileBlurDataURL: placeholders.mobileBlurDataURL,
          desktopBlurDataURL: placeholders.desktopBlurDataURL,
        };
      } else if (placeholders.mobileBlurDataURL) {
        placeholdersMap[imageData.id] = {
          blurDataURL: placeholders.mobileBlurDataURL,
          mobileBlurDataURL: placeholders.mobileBlurDataURL,
        };
      } else if (placeholders.blurDataURL) {
        placeholdersMap[imageData.id] = {
          blurDataURL: placeholders.blurDataURL,
        };
      }
    }
  }

  return placeholdersMap;
}

