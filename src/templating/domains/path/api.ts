/**
 * API du domaine Path
 * Interface pour interagir avec le domaine des composants de path
 */

import { PathComponent } from './types';
import { PathRepository } from './repository';
import { isComponentActive, findNextComponentInDirection, getNextAnchor, type PathComponentData } from '@/utils/pathCalculations';

export interface PathDomainAPI {
  /**
   * Charge tous les composants de path selon le breakpoint
   * @param isDesktop Si true, charge les composants desktop, sinon mobile
   */
  getAllComponents(isDesktop?: boolean): PathComponent[];

  /**
   * Récupère un composant par son ID selon le breakpoint
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   */
  getComponentById(id: string, isDesktop?: boolean): PathComponent | undefined;

  /**
   * Récupère un composant par son anchorId selon le breakpoint
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   */
  getComponentByAnchorId(anchorId: string, isDesktop?: boolean): PathComponent | undefined;

  /**
   * Récupère les composants actifs selon le progress actuel
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   */
  getActiveComponents(currentProgress: number, isDesktop?: boolean): PathComponent[];

  /**
   * Calcule la position d'un composant sur le path
   */
  calculateComponentPosition(
    component: PathComponent,
    getPointOnPath: (progress: number) => { x: number; y: number },
    paddingX: number,
    paddingY: number
  ): { x: number; y: number };

  /**
   * Trouve le prochain composant dans la direction du scroll
   * @param currentProgress Progress actuel (0-1)
   * @param direction Direction du scroll
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   */
  findNextComponentInDirection(
    currentProgress: number,
    direction: 'forward' | 'backward' | null,
    isDesktop?: boolean
  ): PathComponent | null;

  /**
   * Trouve le prochain anchor pour l'auto-scroll basé sur la direction
   * @param fromProgress Progress de départ
   * @param toProgress Progress d'arrivée
   * @param tolerance Tolérance pour la recherche
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   */
  getNextAnchor(
    fromProgress: number,
    toProgress: number,
    tolerance?: number,
    isDesktop?: boolean
  ): PathComponent | null;
}

/**
 * Implémentation de l'API du domaine Path
 */
export class PathDomain implements PathDomainAPI {
  private repository: PathRepository;

  constructor(repository: PathRepository) {
    this.repository = repository;
  }

  getAllComponents(isDesktop: boolean = true): PathComponent[] {
    return this.repository.load(isDesktop);
  }

  getComponentById(id: string, isDesktop: boolean = true): PathComponent | undefined {
    const components = this.getAllComponents(isDesktop);
    return components.find(c => c.id === id);
  }

  getComponentByAnchorId(anchorId: string, isDesktop: boolean = true): PathComponent | undefined {
    const components = this.getAllComponents(isDesktop);
    return components.find(c => c.anchorId === anchorId);
  }

  getActiveComponents(currentProgress: number, isDesktop: boolean = true): PathComponent[] {
    const components = this.getAllComponents(isDesktop);
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

  findNextComponentInDirection(
    currentProgress: number,
    direction: 'forward' | 'backward' | null,
    isDesktop: boolean = true
  ): PathComponent | null {
    const components = this.getAllComponents(isDesktop);
    // Filtrer et convertir PathComponent[] en PathComponentData[] pour la compatibilité
    // Les composants sans anchorId ne peuvent pas être utilisés pour la navigation
    const componentData: PathComponentData[] = components
      .filter(c => c.anchorId) // Filtrer ceux qui ont un anchorId
      .map(c => ({
        id: c.id,
        type: c.type,
        displayName: c.displayName,
        anchorId: c.anchorId!, // TypeScript sait que anchorId existe grâce au filtre
        position: { progress: c.position.progress },
        autoScrollPauseTime: c.autoScrollPauseTime,
      }));
    return findNextComponentInDirection(currentProgress, direction, componentData) as PathComponent | null;
  }

  getNextAnchor(
    fromProgress: number,
    toProgress: number,
    tolerance: number = 0.002,
    isDesktop: boolean = true
  ): PathComponent | null {
    const components = this.getAllComponents(isDesktop);
    // Filtrer et convertir PathComponent[] en PathComponentData[] pour la compatibilité
    // getNextAnchor nécessite des composants avec autoScrollPauseTime, donc on filtre aussi ceux sans anchorId
    const componentData: PathComponentData[] = components
      .filter(c => c.anchorId) // Filtrer ceux qui ont un anchorId
      .map(c => ({
        id: c.id,
        type: c.type,
        displayName: c.displayName,
        anchorId: c.anchorId!, // TypeScript sait que anchorId existe grâce au filtre
        position: { progress: c.position.progress },
        autoScrollPauseTime: c.autoScrollPauseTime,
      }));
    return getNextAnchor(fromProgress, toProgress, componentData, tolerance) as PathComponent | null;
  }
}

