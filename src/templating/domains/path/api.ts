/**
 * API du domaine Path
 * Interface pour interagir avec le domaine des composants de path
 */

import { PathComponent } from './types';
import { PathRepository } from './repository';
import { isComponentActive } from '@/utils/pathCalculations';

export interface PathDomainAPI {
  /**
   * Charge tous les composants de path
   */
  getAllComponents(): PathComponent[];

  /**
   * Récupère un composant par son ID
   */
  getComponentById(id: string): PathComponent | undefined;

  /**
   * Récupère un composant par son anchorId
   */
  getComponentByAnchorId(anchorId: string): PathComponent | undefined;

  /**
   * Récupère les composants actifs selon le progress actuel
   */
  getActiveComponents(currentProgress: number): PathComponent[];

  /**
   * Calcule la position d'un composant sur le path
   */
  calculateComponentPosition(
    component: PathComponent,
    getPointOnPath: (progress: number) => { x: number; y: number },
    paddingX: number,
    paddingY: number
  ): { x: number; y: number };
}

/**
 * Implémentation de l'API du domaine Path
 */
export class PathDomain implements PathDomainAPI {
  private repository: PathRepository;

  constructor(repository: PathRepository) {
    this.repository = repository;
  }

  getAllComponents(): PathComponent[] {
    return this.repository.load();
  }

  getComponentById(id: string): PathComponent | undefined {
    const components = this.getAllComponents();
    return components.find(c => c.id === id);
  }

  getComponentByAnchorId(anchorId: string): PathComponent | undefined {
    const components = this.getAllComponents();
    return components.find(c => c.anchorId === anchorId);
  }

  getActiveComponents(currentProgress: number): PathComponent[] {
    const components = this.getAllComponents();
    return components.filter(c => 
      isComponentActive(c.position.progress, currentProgress)
    );
  }

  calculateComponentPosition(
    component: PathComponent,
    getPointOnPath: (progress: number) => { x: number; y: number },
    paddingX: number,
    paddingY: number
  ): { x: number; y: number } {
    const point = getPointOnPath(component.position.progress);
    return {
      x: point.x + paddingX,
      y: point.y + paddingY,
    };
  }
}

