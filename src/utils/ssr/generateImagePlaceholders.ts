/**
 * Helper pour générer les placeholders blur côté serveur
 * Utilise plaiceholder pour créer des placeholders optimisés
 */

import { getPlaiceholder } from 'plaiceholder';
import path from 'path';
import fs from 'fs/promises';

/**
 * Vérifie si une URL est locale (commence par /)
 */
function isLocalImage(src: string): boolean {
  return src.startsWith('/') && !src.startsWith('//');
}

/**
 * Génère un placeholder blur pour une image locale
 * @param imagePath Chemin de l'image (ex: /images/project.jpg)
 * @returns blurDataURL ou null si erreur
 */
export async function generatePlaceholderForLocalImage(
  imagePath: string
): Promise<string | null> {
  try {
    // Vérifier que l'image est locale
    if (!isLocalImage(imagePath)) {
      return null;
    }

    // Construire le chemin absolu vers l'image
    const publicPath = path.join(process.cwd(), 'public', imagePath);

    // Vérifier que le fichier existe
    try {
      await fs.access(publicPath);
    } catch {
      // Fichier n'existe pas, retourner null
      return null;
    }

    // Lire le fichier image
    const imageBuffer = await fs.readFile(publicPath);
    
    // Générer le placeholder blur
    const { base64 } = await getPlaiceholder(imageBuffer, {
      size: 10, // Taille du placeholder (10px pour performance)
    });

    return base64;
  } catch (error) {
    console.error(`[generatePlaceholderForLocalImage] Erreur pour ${imagePath}:`, error);
    return null;
  }
}

/**
 * Génère les placeholders pour toutes les images d'un composant
 * @param src Source principale de l'image
 * @param mobileSrc Source mobile (optionnelle)
 * @param desktopSrc Source desktop (optionnelle)
 * @returns Objet avec les blurDataURL pour chaque source
 */
export async function generatePlaceholdersForImage(
  src?: string,
  mobileSrc?: string,
  desktopSrc?: string
): Promise<{
  blurDataURL?: string;
  mobileBlurDataURL?: string;
  desktopBlurDataURL?: string;
}> {
  const placeholders: {
    blurDataURL?: string;
    mobileBlurDataURL?: string;
    desktopBlurDataURL?: string;
  } = {};

  // Générer le placeholder pour la source principale
  if (src) {
    const placeholder = await generatePlaceholderForLocalImage(src);
    if (placeholder) {
      placeholders.blurDataURL = placeholder;
    }
  }

  // Générer le placeholder pour mobile
  if (mobileSrc) {
    const placeholder = await generatePlaceholderForLocalImage(mobileSrc);
    if (placeholder) {
      placeholders.mobileBlurDataURL = placeholder;
    }
  }

  // Générer le placeholder pour desktop
  if (desktopSrc) {
    const placeholder = await generatePlaceholderForLocalImage(desktopSrc);
    if (placeholder) {
      placeholders.desktopBlurDataURL = placeholder;
    }
  }

  return placeholders;
}

/**
 * Génère les placeholders pour une ResponsiveImage (structure avec src.mobile et src.desktop)
 */
export async function generatePlaceholdersForResponsiveImage(src: {
  mobile: string;
  desktop: string;
}): Promise<{
  mobileBlurDataURL?: string;
  desktopBlurDataURL?: string;
}> {
  const placeholders: {
    mobileBlurDataURL?: string;
    desktopBlurDataURL?: string;
  } = {};

  // Générer le placeholder pour mobile
  const mobilePlaceholder = await generatePlaceholderForLocalImage(src.mobile);
  if (mobilePlaceholder) {
    placeholders.mobileBlurDataURL = mobilePlaceholder;
  }

  // Générer le placeholder pour desktop
  const desktopPlaceholder = await generatePlaceholderForLocalImage(src.desktop);
  if (desktopPlaceholder) {
    placeholders.desktopBlurDataURL = desktopPlaceholder;
  }

  return placeholders;
}

