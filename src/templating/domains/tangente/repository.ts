/**
 * Repository du domaine Tangente
 * Gère le chargement des données depuis le fichier JSON (desktop ou mobile)
 */

import { PathTangenteComponentsConfig } from './types';
import pathTangenteComponentsDesktop from '../../config/desktop/pathTangente.json';
import pathTangenteComponentsMobile from '../../config/mobile/pathTangente.json';

export class TangenteRepository {
  private desktopConfig: PathTangenteComponentsConfig | null = null;
  private mobileConfig: PathTangenteComponentsConfig | null = null;

  /**
   * Charge la configuration depuis le fichier JSON selon le breakpoint
   * @param isDesktop Si true, charge le fichier desktop, sinon mobile
   */
  load(isDesktop: boolean = true): PathTangenteComponentsConfig {
    if (isDesktop) {
      if (!this.desktopConfig) {
        this.desktopConfig = pathTangenteComponentsDesktop as PathTangenteComponentsConfig;
      }
      return this.desktopConfig;
    } else {
      if (!this.mobileConfig) {
        this.mobileConfig = pathTangenteComponentsMobile as PathTangenteComponentsConfig;
      }
      return this.mobileConfig;
    }
  }

  /**
   * Recharge la configuration (utile pour le hot-reload en développement)
   * @param isDesktop Si true, recharge le fichier desktop, sinon mobile
   */
  reload(isDesktop: boolean = true): PathTangenteComponentsConfig {
    if (isDesktop) {
      this.desktopConfig = null;
    } else {
      this.mobileConfig = null;
    }
    return this.load(isDesktop);
  }
}

