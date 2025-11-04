/**
 * API du domaine Tangente
 * Interface pour interagir avec le domaine des composants tangente
 */

import { PathTangenteComponent } from './types';
import { TangenteRepository } from './repository';

export interface TangenteDomainAPI {
  /**
   * Charge tous les composants tangente
   */
  getAllComponents(): PathTangenteComponent[];

  /**
   * Récupère un composant par son ID
   */
  getComponentById(id: string): PathTangenteComponent | undefined;

  /**
   * Récupère les props nécessaires pour un composant TextOnPath
   */
  getTextOnPathProps(component: PathTangenteComponent): {
    text: string;
    startProgress: number;
    length: number;
    offset: number;
  } | null;
}

/**
 * Implémentation de l'API du domaine Tangente
 */
export class TangenteDomain implements TangenteDomainAPI {
  private repository: TangenteRepository;

  constructor(repository: TangenteRepository) {
    this.repository = repository;
  }

  getAllComponents(): PathTangenteComponent[] {
    return this.repository.load();
  }

  getComponentById(id: string): PathTangenteComponent | undefined {
    const components = this.getAllComponents();
    return components.find(c => c.id === id);
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

