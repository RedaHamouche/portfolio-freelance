/**
 * Point d'entrée du domaine Tangente
 * Exporte l'API et les types
 */

import { TangenteDomain, TangenteDomainAPI } from './api';
import { TangenteRepository } from './repository';
import type { PathTangenteComponent, PathTangenteComponentsConfig, PathTangenteComponentPosition } from './types';

// Factory pour créer une instance du domaine
export function createTangenteDomain(): TangenteDomainAPI {
  const repository = new TangenteRepository();
  return new TangenteDomain(repository);
}

// Export des types
export type { PathTangenteComponent, PathTangenteComponentsConfig, PathTangenteComponentPosition };

// Export de l'API et des implémentations
export { TangenteDomain, TangenteRepository };

