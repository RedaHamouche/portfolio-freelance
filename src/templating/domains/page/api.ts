/**
 * API du domaine Page
 * Interface pour interagir avec le domaine des composants de page
 */

import { PageConfig, PageComponent, ComponentPosition } from './types';
import { PageRepository } from './repository';

export interface PageDomainAPI {
  /**
   * Charge la configuration des composants de page
   */
  loadConfig(): PageConfig;

  /**
   * Récupère tous les composants de page
   */
  getComponents(): PageComponent[];

  /**
   * Récupère un composant par son index
   */
  getComponent(index: number): PageComponent | undefined;

  /**
   * Calcule la position finale d'un composant en fonction de sa position relative
   * et du point d'origine du SVG
   */
  calculatePosition(
    component: PageComponent,
    originPoint: { x: number; y: number },
    isDesktop: boolean
  ): { top?: number; left?: number };
}

/**
 * Implémentation de l'API du domaine Page
 */
export class PageDomain implements PageDomainAPI {
  private repository: PageRepository;

  constructor(repository: PageRepository) {
    this.repository = repository;
  }

  loadConfig(): PageConfig {
    return this.repository.load();
  }

  getComponents(): PageComponent[] {
    const config = this.loadConfig();
    return config.components || [];
  }

  getComponent(index: number): PageComponent | undefined {
    const components = this.getComponents();
    return components[index];
  }

  calculatePosition(
    component: PageComponent,
    originPoint: { x: number; y: number },
    isDesktop: boolean
  ): { top?: number; left?: number } {
    const position = component.position;
    let top: number | undefined;
    let left: number | undefined;

    // Type guard pour la structure responsive
    const isResponsivePosition = (pos: ComponentPosition): pos is import('./types').ResponsivePosition => {
      return 'desktop' in pos || 'mobile' in pos;
    };

    if (isResponsivePosition(position)) {
      const responsivePosition = isDesktop ? position.desktop : position.mobile;
      if (responsivePosition?.top !== undefined) {
        top = originPoint.y + responsivePosition.top;
      }
      if (responsivePosition?.left !== undefined) {
        left = originPoint.x + responsivePosition.left;
      }
    } else {
      // Legacy position
      const legacyPosition = position as import('./types').LegacyPosition;
      if (legacyPosition.top !== undefined) {
        top = originPoint.y + legacyPosition.top;
      }
      if (legacyPosition.left !== undefined) {
        left = originPoint.x + legacyPosition.left;
      }
    }

    return { top, left };
  }
}

