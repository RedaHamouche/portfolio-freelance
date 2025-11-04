/**
 * Point d'entrée du domaine Path
 * Exporte l'API et les types
 */

import { PathDomain, PathDomainAPI } from './api';
import { PathRepository } from './repository';
import type { PathComponent, PathComponentsConfig, PathComponentPosition } from './types';

// Factory pour créer une instance du domaine
export function createPathDomain(): PathDomainAPI {
  const repository = new PathRepository();
  return new PathDomain(repository);
}

// Export des types
export type { PathComponent, PathComponentsConfig, PathComponentPosition };

// Export de l'API et des implémentations
export { PathDomain, PathRepository };

