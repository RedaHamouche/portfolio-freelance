/**
 * Repository du domaine Page
 * Gère le chargement des données depuis le fichier JSON
 */

import { PageConfig } from './types';
import pageConfig from '../../config/page.json';

export class PageRepository {
  private config: PageConfig | null = null;

  /**
   * Charge la configuration depuis le fichier JSON
   */
  load(): PageConfig {
    if (!this.config) {
      this.config = pageConfig as PageConfig;
    }
    return this.config;
  }

  /**
   * Recharge la configuration (utile pour le hot-reload en développement)
   */
  reload(): PageConfig {
    this.config = null;
    return this.load();
  }
}

