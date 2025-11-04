/**
 * Repository du domaine Tangente
 * Gère le chargement des données depuis le fichier JSON
 */

import { PathTangenteComponentsConfig } from './types';
import pathTangenteComponentsConfig from '../../config/pathTangenteComponents.json';

export class TangenteRepository {
  private config: PathTangenteComponentsConfig | null = null;

  /**
   * Charge la configuration depuis le fichier JSON
   */
  load(): PathTangenteComponentsConfig {
    if (!this.config) {
      this.config = pathTangenteComponentsConfig as PathTangenteComponentsConfig;
    }
    return this.config;
  }

  /**
   * Recharge la configuration (utile pour le hot-reload en développement)
   */
  reload(): PathTangenteComponentsConfig {
    this.config = null;
    return this.load();
  }
}

