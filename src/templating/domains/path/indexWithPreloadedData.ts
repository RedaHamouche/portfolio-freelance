/**
 * Factory pour créer un domaine Path avec données pré-chargées
 */

import { PathDomain, PathDomainAPI } from './api';
import { PathRepositoryWithPreloadedData } from './repositoryWithPreloadedData';
import type { SerializedIndexes } from '@/utils/ssr/loadServerConfigs';
import type { PathComponentsConfig } from './types';

export function createPathDomainWithPreloadedData(
  desktopConfig: PathComponentsConfig,
  mobileConfig: PathComponentsConfig,
  desktopIndexes: SerializedIndexes,
  mobileIndexes: SerializedIndexes
): PathDomainAPI {
  const repository = new PathRepositoryWithPreloadedData(
    desktopConfig,
    mobileConfig,
    desktopIndexes,
    mobileIndexes
  );
  return new PathDomain(repository);
}

