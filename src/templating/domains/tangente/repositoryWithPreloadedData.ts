/**
 * Repository du domaine Tangente avec données pré-chargées
 * Utilise les données pré-chargées côté serveur pour éviter les chargements côté client
 */

import { PathTangenteComponentsConfig } from './types';
import type { TangenteRepositoryLike } from './repository';

export class TangenteRepositoryWithPreloadedData implements TangenteRepositoryLike {
  private desktopConfig: PathTangenteComponentsConfig;
  private mobileConfig: PathTangenteComponentsConfig;

  constructor(
    desktopConfig: PathTangenteComponentsConfig,
    mobileConfig: PathTangenteComponentsConfig
  ) {
    this.desktopConfig = desktopConfig;
    this.mobileConfig = mobileConfig;
  }

  /**
   * Charge la configuration (déjà pré-chargée, retourne directement)
   */
  load(isDesktop: boolean = true): PathTangenteComponentsConfig {
    return isDesktop ? this.desktopConfig : this.mobileConfig;
  }

  /**
   * Recharge la configuration (non supporté avec données pré-chargées)
   */
  reload(isDesktop: boolean = true): PathTangenteComponentsConfig {
    // Avec données pré-chargées, on ne peut pas recharger
    // Retourner la config actuelle
    return this.load(isDesktop);
  }
}

