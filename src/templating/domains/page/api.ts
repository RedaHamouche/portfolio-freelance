/**
 * API du domaine Page
 * Interface pour interagir avec le domaine des composants de page
 */

import { PageConfig, PageComponent } from './types';
import type { PageRepositoryLike } from './repository';

export interface PageDomainAPI {
  /**
   * Charge la configuration des composants de page selon le breakpoint
   * @param isDesktop Si true, charge les composants desktop, sinon mobile
   */
  loadConfig(isDesktop?: boolean): PageConfig;

  /**
   * Récupère tous les composants de page selon le breakpoint
   * @param isDesktop Si true, charge les composants desktop, sinon mobile
   */
  getComponents(isDesktop?: boolean): PageComponent[];

  /**
   * Récupère un composant par son index selon le breakpoint
   * @param isDesktop Si true, charge les composants desktop, sinon mobile
   */
  getComponent(index: number, isDesktop?: boolean): PageComponent | undefined;

  /**
   * Calcule la position finale d'un composant en fonction de sa position relative
   * et du point d'origine du SVG
   */
  calculatePosition(
    component: PageComponent,
    originPoint: { x: number; y: number }
  ): { top?: number; left?: number };
}

/**
 * Implémentation de l'API du domaine Page
 */
export class PageDomain implements PageDomainAPI {
  private repository: PageRepositoryLike;

  constructor(repository: PageRepositoryLike) {
    this.repository = repository;
  }

  loadConfig(isDesktop: boolean = true): PageConfig {
    return this.repository.load(isDesktop);
  }

  getComponents(isDesktop: boolean = true): PageComponent[] {
    const config = this.loadConfig(isDesktop);
    return config.components || [];
  }

  getComponent(index: number, isDesktop: boolean = true): PageComponent | undefined {
    const components = this.getComponents(isDesktop);
    return components[index];
  }

  calculatePosition(
    component: PageComponent,
    originPoint: { x: number; y: number }
  ): { top?: number; left?: number } {
    const position = component.position;
    let top: number | undefined;
    let left: number | undefined;

    if (position.top !== undefined) {
      top = originPoint.y + position.top;
    }
    if (position.left !== undefined) {
      left = originPoint.x + position.left;
    }

    return { top, left };
  }
}

