/**
 * Factory pour créer un domaine Page avec données pré-chargées
 */

import { PageDomain, PageDomainAPI } from './api';
import { PageRepositoryWithPreloadedData } from './repositoryWithPreloadedData';
import type { PageConfig } from './types';

export function createPageDomainWithPreloadedData(
  desktopConfig: PageConfig,
  mobileConfig: PageConfig
): PageDomainAPI {
  const repository = new PageRepositoryWithPreloadedData(desktopConfig, mobileConfig);
  return new PageDomain(repository);
}

