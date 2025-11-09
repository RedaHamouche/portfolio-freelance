/**
 * Helper pour pré-calculer le progress initial côté serveur
 * Évite les calculs côté client et améliore le FCP
 */

import type { ServerConfigs } from './loadServerConfigs';

export interface InitialProgressResult {
  progress: number;
  source: 'hash' | 'default';
  anchorId?: string | null;
}

const DEFAULT_PROGRESS = 0.005; // 0.5%

/**
 * Valide qu'un progress est dans la plage valide [0, 1]
 */
function isValidProgress(progress: number): boolean {
  return !isNaN(progress) && progress >= 0 && progress <= 1;
}

/**
 * Extrait l'anchorID du hash (sans le #)
 */
function extractAnchorId(hash: string): string {
  return hash.replace('#', '').trim();
}

/**
 * Récupère le progress depuis un anchorID dans les configs
 */
function getProgressFromAnchorId(
  anchorId: string,
  configs: ServerConfigs
): number | null {
  // Chercher d'abord dans desktop
  const desktopComponent = configs.path.desktopIndexes.anchorIdIndex[anchorId];
  if (desktopComponent) {
    const progress = desktopComponent.position?.progress;
    if (progress !== undefined && progress !== null && isValidProgress(progress)) {
      return progress;
    }
  }

  // Si non trouvé, chercher dans mobile
  const mobileComponent = configs.path.mobileIndexes.anchorIdIndex[anchorId];
  if (mobileComponent) {
    const progress = mobileComponent.position?.progress;
    if (progress !== undefined && progress !== null && isValidProgress(progress)) {
      return progress;
    }
  }

  return null;
}

/**
 * Pré-calcul le progress initial côté serveur
 * 
 * RÈGLES (priorité décroissante) :
 * 1. Hash (anchorID) → progress du composant
 * 2. Default → progress par défaut (0.005)
 * 
 * Note: localStorage n'est pas accessible côté serveur,
 * donc on ne peut pas pré-calculer le progress depuis localStorage.
 * Le client devra vérifier localStorage et ajuster si nécessaire.
 * 
 * @param hash Hash de l'URL (ex: "#projectsBanner") ou null
 * @param configs Configurations pré-chargées
 * @returns Résultat avec le progress et sa source
 */
export function calculateInitialProgress(
  hash: string | null | undefined,
  configs: ServerConfigs
): InitialProgressResult {
  // RÈGLE 1: Hash (anchorID) → progress
  if (hash) {
    const cleanHash = hash.replace('#', '').trim();
    if (cleanHash.length > 0) {
      const anchorId = extractAnchorId(hash);
      const hashProgress = getProgressFromAnchorId(anchorId, configs);

      if (hashProgress !== null) {
        return {
          progress: hashProgress,
          source: 'hash',
          anchorId,
        };
      }
    }
  }

  // RÈGLE 2: Default → progress par défaut
  return {
    progress: DEFAULT_PROGRESS,
    source: 'default',
  };
}

