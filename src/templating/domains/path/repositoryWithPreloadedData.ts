/**
 * Repository du domaine Path avec données pré-chargées
 * Utilise les données pré-chargées côté serveur pour éviter les chargements côté client
 */

import { PathComponentsConfig, PathComponent } from './types';
import type { SerializedIndexes } from '@/utils/ssr/loadServerConfigs';
import type { PathRepositoryLike } from './repository';

interface Indexes {
  idIndex: Map<string, PathComponent>;
  anchorIdIndex: Map<string, PathComponent>;
}

/**
 * Convertit les index sérialisés (objets) en Maps
 */
function deserializeIndexes(serialized: SerializedIndexes): Indexes {
  const idIndex = new Map<string, PathComponent>();
  const anchorIdIndex = new Map<string, PathComponent>();

  Object.entries(serialized.idIndex).forEach(([id, component]) => {
    idIndex.set(id, component);
  });

  Object.entries(serialized.anchorIdIndex).forEach(([anchorId, component]) => {
    anchorIdIndex.set(anchorId, component);
  });

  return { idIndex, anchorIdIndex };
}

export class PathRepositoryWithPreloadedData implements PathRepositoryLike {
  private desktopConfig: PathComponentsConfig;
  private mobileConfig: PathComponentsConfig;
  private desktopIndexes: Indexes;
  private mobileIndexes: Indexes;

  constructor(
    desktopConfig: PathComponentsConfig,
    mobileConfig: PathComponentsConfig,
    desktopIndexes: SerializedIndexes,
    mobileIndexes: SerializedIndexes
  ) {
    this.desktopConfig = desktopConfig;
    this.mobileConfig = mobileConfig;
    this.desktopIndexes = deserializeIndexes(desktopIndexes);
    this.mobileIndexes = deserializeIndexes(mobileIndexes);
  }

  /**
   * Charge la configuration (déjà pré-chargée, retourne directement)
   */
  load(isDesktop: boolean = true): PathComponentsConfig {
    return isDesktop ? this.desktopConfig : this.mobileConfig;
  }

  /**
   * Récupère un composant par son ID (O(1) avec Map)
   */
  getComponentById(id: string, isDesktop: boolean = true): PathComponent | undefined {
    const indexes = isDesktop ? this.desktopIndexes : this.mobileIndexes;
    return indexes.idIndex.get(id);
  }

  /**
   * Récupère un composant par son anchorId (O(1) avec Map)
   */
  getComponentByAnchorId(anchorId: string, isDesktop: boolean = true): PathComponent | undefined {
    const indexes = isDesktop ? this.desktopIndexes : this.mobileIndexes;
    return indexes.anchorIdIndex.get(anchorId);
  }

  /**
   * Recharge la configuration (non supporté avec données pré-chargées)
   */
  reload(isDesktop: boolean = true): PathComponentsConfig {
    // Avec données pré-chargées, on ne peut pas recharger
    // Retourner la config actuelle
    return this.load(isDesktop);
  }
}

