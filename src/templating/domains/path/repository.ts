/**
 * Repository du domaine Path
 * Gère le chargement des données depuis le fichier JSON
 */

import { PathComponentsConfig } from './types';
import pathComponentsConfig from '../../config/pathComponents.json';

export class PathRepository {
  private config: PathComponentsConfig | null = null;

  /**
   * Charge la configuration depuis le fichier JSON
   */
  load(): PathComponentsConfig {
    if (!this.config) {
      this.config = pathComponentsConfig as PathComponentsConfig;
    }
    return this.config;
  }

  /**
   * Recharge la configuration (utile pour le hot-reload en développement)
   */
  reload(): PathComponentsConfig {
    this.config = null;
    return this.load();
  }
}

