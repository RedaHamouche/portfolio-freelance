/**
 * Repository du domaine Page avec données pré-chargées
 * Utilise les données pré-chargées côté serveur pour éviter les chargements côté client
 */

import { PageConfig } from './types';
import type { PageRepositoryLike } from './repository';

export class PageRepositoryWithPreloadedData implements PageRepositoryLike {
  private desktopConfig: PageConfig;
  private mobileConfig: PageConfig;

  constructor(desktopConfig: PageConfig, mobileConfig: PageConfig) {
    this.desktopConfig = desktopConfig;
    this.mobileConfig = mobileConfig;
  }

  /**
   * Charge la configuration (déjà pré-chargée, retourne directement)
   */
  load(isDesktop: boolean = true): PageConfig {
    return isDesktop ? this.desktopConfig : this.mobileConfig;
  }

  /**
   * Recharge la configuration (non supporté avec données pré-chargées)
   */
  reload(isDesktop: boolean = true): PageConfig {
    // Avec données pré-chargées, on ne peut pas recharger
    // Retourner la config actuelle
    return this.load(isDesktop);
  }
}

