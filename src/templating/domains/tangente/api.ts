/**
 * API du domaine Tangente
 * Interface pour interagir avec le domaine des composants tangente
 */

import { PathTangenteComponent } from './types';
import { TangenteRepository } from './repository';

export interface TangenteDomainAPI {
  /**
   * Charge tous les composants tangente selon le breakpoint
   * @param isDesktop Si true, charge les composants desktop, sinon mobile
   */
  getAllComponents(isDesktop?: boolean): PathTangenteComponent[];

  /**
   * Récupère un composant par son ID selon le breakpoint
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   */
  getComponentById(id: string, isDesktop?: boolean): PathTangenteComponent | undefined;

  /**
   * Récupère les props nécessaires pour un composant TextOnPath
   */
  getTextOnPathProps(component: PathTangenteComponent): {
    text: string;
    startProgress: number;
    length: number;
    offset: number;
  } | null;

  /**
   * Récupère la position (startProgress) d'un composant
   */
  getComponentPosition(component: PathTangenteComponent): number;

  /**
   * Récupère l'offset d'un composant
   */
  getComponentOffset(component: PathTangenteComponent): number;
}

/**
 * Implémentation de l'API du domaine Tangente
 */
export class TangenteDomain implements TangenteDomainAPI {
  private repository: TangenteRepository;
  
  // OPTIMISATION: Cache des composants chargés (une fois pour desktop, une fois pour mobile)
  // Le JSON ne change pas après le chargement de la page
  private componentsCache: {
    desktop?: PathTangenteComponent[];
    mobile?: PathTangenteComponent[];
  } = {};

  constructor(repository: TangenteRepository) {
    this.repository = repository;
  }

  getAllComponents(isDesktop: boolean = true): PathTangenteComponent[] {
    // OPTIMISATION: Mettre en cache les composants (le JSON ne change pas après le chargement)
    const cacheKey = isDesktop ? 'desktop' : 'mobile';
    if (!this.componentsCache[cacheKey]) {
      this.componentsCache[cacheKey] = this.repository.load(isDesktop);
    }
    return this.componentsCache[cacheKey];
  }

  getComponentById(id: string, isDesktop: boolean = true): PathTangenteComponent | undefined {
    const components = this.getAllComponents(isDesktop);
    return components.find(c => c.id === id);
  }

  getComponentPosition(component: PathTangenteComponent): number {
    return component.position.startProgress ?? component.position.progress ?? 0.5;
  }

  getComponentOffset(component: PathTangenteComponent): number {
    return component.offset ?? 40;
  }

  getTextOnPathProps(component: PathTangenteComponent): {
    text: string;
    startProgress: number;
    length: number;
    offset: number;
  } | null {
    if (!component.text) {
      return null;
    }

    const startProgress = component.position.startProgress ?? component.position.progress ?? 0.5;
    const length = component.position.length ?? 0.1;
    const offset = component.offset ?? 40;

    return {
      text: component.text,
      startProgress,
      length,
      offset,
    };
  }
}

