/**
 * Point d'entrée du domaine Page
 * Exporte l'API et les types
 */

import { PageDomain, PageDomainAPI } from './api';
import { PageRepository } from './repository';
import type { PageComponent, PageConfig, ComponentPosition } from './types';

// Factory pour créer une instance du domaine
export function createPageDomain(): PageDomainAPI {
  const repository = new PageRepository();
  return new PageDomain(repository);
}

// Export des types
export type { PageComponent, PageConfig, ComponentPosition };

// Export de l'API et des implémentations
export { PageDomain, PageRepository };

