/**
 * Repository du domaine Path
 * Gère le chargement des données depuis le fichier JSON (desktop ou mobile)
 */

import { PathComponentsConfig } from './types';
import pathComponentsConfigDesktop from '../../config/desktop/pathComponents.json';
import pathComponentsConfigMobile from '../../config/mobile/pathComponents.json';

export class PathRepository {
  private desktopConfig: PathComponentsConfig | null = null;
  private mobileConfig: PathComponentsConfig | null = null;

  /**
   * Charge la configuration depuis le fichier JSON selon le breakpoint
   * @param isDesktop Si true, charge le fichier desktop, sinon mobile
   */
  load(isDesktop: boolean = true): PathComponentsConfig {
    if (isDesktop) {
      if (!this.desktopConfig) {
        this.desktopConfig = pathComponentsConfigDesktop as PathComponentsConfig;
      }
      return this.desktopConfig;
    } else {
      if (!this.mobileConfig) {
        this.mobileConfig = pathComponentsConfigMobile as PathComponentsConfig;
      }
      return this.mobileConfig;
    }
  }

  /**
   * Recharge la configuration (utile pour le hot-reload en développement)
   * @param isDesktop Si true, recharge le fichier desktop, sinon mobile
   */
  reload(isDesktop: boolean = true): PathComponentsConfig {
    if (isDesktop) {
      this.desktopConfig = null;
    } else {
      this.mobileConfig = null;
    }
    return this.load(isDesktop);
  }
}

