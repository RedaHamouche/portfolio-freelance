/**
 * Factory pour créer un domaine Tangente avec données pré-chargées
 */

import { TangenteDomain, TangenteDomainAPI } from './api';
import { TangenteRepositoryWithPreloadedData } from './repositoryWithPreloadedData';
import type { PathTangenteComponentsConfig } from './types';

export function createTangenteDomainWithPreloadedData(
  desktopConfig: PathTangenteComponentsConfig,
  mobileConfig: PathTangenteComponentsConfig
): TangenteDomainAPI {
  const repository = new TangenteRepositoryWithPreloadedData(desktopConfig, mobileConfig);
  return new TangenteDomain(repository);
}

