/**
 * Helper pour charger les configurations côté serveur
 * Pré-construit les index pour éviter les calculs côté client
 */

import pathComponentsConfigDesktop from '@/templating/config/desktop/path.json';
import pathComponentsConfigMobile from '@/templating/config/mobile/path.json';
import pageConfigDesktop from '@/templating/config/desktop/page.json';
import pageConfigMobile from '@/templating/config/mobile/page.json';
import pathTangenteComponentsDesktop from '@/templating/config/desktop/pathTangente.json';
import pathTangenteComponentsMobile from '@/templating/config/mobile/pathTangente.json';

import type { PathComponentsConfig, PathComponent } from '@/templating/domains/path/types';
import type { PageConfig } from '@/templating/domains/page/types';
import type { PathTangenteComponentsConfig } from '@/templating/domains/tangente/types';

/**
 * Index sérialisés pour le transfert client-serveur
 * Les Maps ne peuvent pas être sérialisées, on utilise des objets
 */
export interface SerializedIndexes {
  idIndex: Record<string, PathComponent>;
  anchorIdIndex: Record<string, PathComponent>;
}

/**
 * Construit les index (Maps) pour des recherches rapides
 */
function buildIndexes(config: PathComponentsConfig): SerializedIndexes {
  const idIndex: Record<string, PathComponent> = {};
  const anchorIdIndex: Record<string, PathComponent> = {};

  config.forEach((component) => {
    idIndex[component.id] = component;
    if (component.anchorId) {
      anchorIdIndex[component.anchorId] = component;
    }
  });

  return { idIndex, anchorIdIndex };
}

/**
 * Configuration pré-chargée côté serveur
 */
export interface ServerConfigs {
  path: {
    desktop: PathComponentsConfig;
    mobile: PathComponentsConfig;
    desktopIndexes: SerializedIndexes;
    mobileIndexes: SerializedIndexes;
  };
  page: {
    desktop: PageConfig;
    mobile: PageConfig;
  };
  tangente: {
    desktop: PathTangenteComponentsConfig;
    mobile: PathTangenteComponentsConfig;
  };
}

/**
 * Placeholders blur pour les images
 */
export interface ImagePlaceholders {
  [componentId: string]: {
    blurDataURL?: string;
    mobileBlurDataURL?: string;
    desktopBlurDataURL?: string;
  };
}

/**
 * Charge toutes les configurations côté serveur
 * Pré-construit les index pour éviter les calculs côté client
 */
export async function loadServerConfigs(): Promise<ServerConfigs> {
  // Charger les configs (déjà importées statiquement)
  const pathDesktop = pathComponentsConfigDesktop as PathComponentsConfig;
  const pathMobile = pathComponentsConfigMobile as PathComponentsConfig;
  const pageDesktop = pageConfigDesktop as PageConfig;
  const pageMobile = pageConfigMobile as PageConfig;
  const tangenteDesktop = pathTangenteComponentsDesktop as PathTangenteComponentsConfig;
  const tangenteMobile = pathTangenteComponentsMobile as PathTangenteComponentsConfig;

  // Pré-construire les index côté serveur
  const desktopIndexes = buildIndexes(pathDesktop);
  const mobileIndexes = buildIndexes(pathMobile);

  return {
    path: {
      desktop: pathDesktop,
      mobile: pathMobile,
      desktopIndexes,
      mobileIndexes,
    },
    page: {
      desktop: pageDesktop,
      mobile: pageMobile,
    },
    tangente: {
      desktop: tangenteDesktop,
      mobile: tangenteMobile,
    },
  };
}

