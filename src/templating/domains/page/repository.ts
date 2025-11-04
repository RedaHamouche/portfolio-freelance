/**
 * Repository du domaine Page
 * Gère le chargement des données depuis le fichier JSON (desktop ou mobile)
 */

import { PageConfig } from './types';
import pageConfigDesktop from '../../config/desktop/page.json';
import pageConfigMobile from '../../config/mobile/page.json';

export class PageRepository {
  private desktopConfig: PageConfig | null = null;
  private mobileConfig: PageConfig | null = null;

  /**
   * Charge la configuration depuis le fichier JSON selon le breakpoint
   * @param isDesktop Si true, charge le fichier desktop, sinon mobile
   */
  load(isDesktop: boolean = true): PageConfig {
    if (isDesktop) {
      if (!this.desktopConfig) {
        this.desktopConfig = pageConfigDesktop as PageConfig;
      }
      return this.desktopConfig;
    } else {
      if (!this.mobileConfig) {
        this.mobileConfig = pageConfigMobile as PageConfig;
      }
      return this.mobileConfig;
    }
  }

  /**
   * Recharge la configuration (utile pour le hot-reload en développement)
   * @param isDesktop Si true, recharge le fichier desktop, sinon mobile
   */
  reload(isDesktop: boolean = true): PageConfig {
    if (isDesktop) {
      this.desktopConfig = null;
    } else {
      this.mobileConfig = null;
    }
    return this.load(isDesktop);
  }
}
