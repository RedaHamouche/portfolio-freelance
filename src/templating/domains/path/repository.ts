/**
 * Repository du domaine Path
 * Gère le chargement des données depuis le fichier JSON (desktop ou mobile)
 * Optimisé avec des Maps indexées pour des recherches O(1)
 */

import { PathComponentsConfig, PathComponent } from './types';
import pathComponentsConfigDesktop from '../../config/desktop/path.json';
import pathComponentsConfigMobile from '../../config/mobile/path.json';

interface Indexes {
  idIndex: Map<string, PathComponent>;
  anchorIdIndex: Map<string, PathComponent>;
}

export class PathRepository {
  private desktopConfig: PathComponentsConfig | null = null;
  private mobileConfig: PathComponentsConfig | null = null;

  // Index pour recherches rapides O(1)
  private desktopIndexes: Indexes | null = null;
  private mobileIndexes: Indexes | null = null;

  /**
   * Construit les index (Maps) pour des recherches rapides
   */
  private buildIndexes(config: PathComponentsConfig): Indexes {
    const idIndex = new Map<string, PathComponent>();
    const anchorIdIndex = new Map<string, PathComponent>();

    config.forEach((component) => {
      idIndex.set(component.id, component);
      if (component.anchorId) {
        anchorIdIndex.set(component.anchorId, component);
      }
    });

    return { idIndex, anchorIdIndex };
  }

  /**
   * Charge la configuration depuis le fichier JSON selon le breakpoint
   * Construit automatiquement les index pour des recherches O(1)
   * @param isDesktop Si true, charge le fichier desktop, sinon mobile
   */
  load(isDesktop: boolean = true): PathComponentsConfig {
    if (isDesktop) {
      if (!this.desktopConfig) {
        this.desktopConfig = pathComponentsConfigDesktop as PathComponentsConfig;
        // Construire les index au chargement
        this.desktopIndexes = this.buildIndexes(this.desktopConfig);
      }
      return this.desktopConfig;
    } else {
      if (!this.mobileConfig) {
        this.mobileConfig = pathComponentsConfigMobile as PathComponentsConfig;
        // Construire les index au chargement
        this.mobileIndexes = this.buildIndexes(this.mobileConfig);
      }
      return this.mobileConfig;
    }
  }

  /**
   * Récupère un composant par son ID (O(1) avec Map)
   * @param id ID du composant
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   */
  getComponentById(id: string, isDesktop: boolean = true): PathComponent | undefined {
    const indexes = isDesktop ? this.desktopIndexes : this.mobileIndexes;
    if (!indexes) {
      // Si les index n'existent pas, charger la config d'abord
      this.load(isDesktop);
      const updatedIndexes = isDesktop ? this.desktopIndexes : this.mobileIndexes;
      return updatedIndexes?.idIndex.get(id);
    }
    return indexes.idIndex.get(id);
  }

  /**
   * Récupère un composant par son anchorId (O(1) avec Map)
   * @param anchorId Anchor ID du composant
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   */
  getComponentByAnchorId(anchorId: string, isDesktop: boolean = true): PathComponent | undefined {
    const indexes = isDesktop ? this.desktopIndexes : this.mobileIndexes;
    if (!indexes) {
      // Si les index n'existent pas, charger la config d'abord
      this.load(isDesktop);
      const updatedIndexes = isDesktop ? this.desktopIndexes : this.mobileIndexes;
      return updatedIndexes?.anchorIdIndex.get(anchorId);
    }
    return indexes.anchorIdIndex.get(anchorId);
  }

  /**
   * Recharge la configuration (utile pour le hot-reload en développement)
   * Invalide aussi les index
   * @param isDesktop Si true, recharge le fichier desktop, sinon mobile
   */
  reload(isDesktop: boolean = true): PathComponentsConfig {
    if (isDesktop) {
      this.desktopConfig = null;
      this.desktopIndexes = null;
    } else {
      this.mobileConfig = null;
      this.mobileIndexes = null;
    }
    return this.load(isDesktop);
  }
}

