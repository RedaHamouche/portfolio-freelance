'use client';

/**
 * Wrapper client pour MapScroller qui reçoit les données pré-chargées côté serveur
 * Initialise les domaines avec les données pré-chargées pour éviter les chargements côté client
 */

import React, { useState, useEffect, useMemo } from 'react';
import MapScroller from './index';
import LoadingScreen from '@/components/app/LoadingScreen';
import { TemplatingProvider } from '@/contexts/TemplatingContext';
import { DeviceProvider } from '@/contexts/DeviceContext';
import { createPageDomainWithPreloadedData } from '@/templating/domains/page/indexWithPreloadedData';
import { createPathDomainWithPreloadedData } from '@/templating/domains/path/indexWithPreloadedData';
import { createTangenteDomainWithPreloadedData } from '@/templating/domains/tangente/indexWithPreloadedData';
import type { ServerConfigs, ImagePlaceholders } from '@/utils/ssr/loadServerConfigs';
import type { InitialProgressResult } from '@/utils/ssr/calculateInitialProgress';
import { useScrollInitializationWithPreloadedProgress } from './hooks/useScrollInitialization/useScrollInitializationWithPreloadedProgress';
import { ImagePlaceholdersProvider } from '@/contexts/ImagePlaceholdersContext';

interface MapScrollerWrapperProps {
  serverConfigs: ServerConfigs;
  initialProgress: InitialProgressResult;
  isDesktop: boolean;
  imagePlaceholders: ImagePlaceholders;
}

export default function MapScrollerWrapper({
  serverConfigs,
  initialProgress,
  isDesktop,
  imagePlaceholders,
}: MapScrollerWrapperProps) {
  // Créer les domaines avec les données pré-chargées (mémoïsés)
  // Ces domaines utilisent les JSONs et index pré-construits côté serveur
  const pageDomain = useMemo(
    () =>
      createPageDomainWithPreloadedData(
        serverConfigs.page.desktop,
        serverConfigs.page.mobile
      ),
    [serverConfigs.page]
  );

  const pathDomain = useMemo(
    () =>
      createPathDomainWithPreloadedData(
        serverConfigs.path.desktop,
        serverConfigs.path.mobile,
        serverConfigs.path.desktopIndexes,
        serverConfigs.path.mobileIndexes
      ),
    [serverConfigs.path]
  );

  const tangenteDomain = useMemo(
    () =>
      createTangenteDomainWithPreloadedData(
        serverConfigs.tangente.desktop,
        serverConfigs.tangente.mobile
      ),
    [serverConfigs.tangente]
  );

  // Utiliser le hook d'initialisation avec progress pré-chargé
  useScrollInitializationWithPreloadedProgress(initialProgress);

  // État pour gérer le loading screen
  const [showLoading, setShowLoading] = useState(true);
  const [isScrollSynced, setIsScrollSynced] = useState(false);

  useEffect(() => {
    // Marquer comme synced après l'hydratation
    setIsScrollSynced(true);
  }, []);

  const handleLoadingComplete = () => {
    setShowLoading(false);
  };

  // Créer un TemplatingProvider avec les domaines pré-chargés
  // Ce provider override celui du layout pour cette partie de l'arbre
  // Les composants enfants utiliseront les domaines pré-chargés au lieu de créer de nouveaux domaines
  return (
    <DeviceProvider isDesktop={isDesktop}>
      <ImagePlaceholdersProvider placeholders={imagePlaceholders}>
        <TemplatingProvider
          preloadedDomains={{
            pageDomain,
            pathDomain,
            tangenteDomain,
          }}
        >
          {showLoading ? (
            <LoadingScreen onComplete={handleLoadingComplete} isDesktop={isDesktop} />
          ) : (
            <MapScroller isScrollSynced={isScrollSynced} />
          )}
        </TemplatingProvider>
      </ImagePlaceholdersProvider>
    </DeviceProvider>
  );
}

