'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ScrollEasingService, EasingFunctions } from '../hooks/useManualScrollSync/domain/ScrollEasingService';
import { ScrollProgressCalculator } from '../hooks/useManualScrollSync/domain/ScrollProgressCalculator';
import { ScrollStateDetector } from '../hooks/useManualScrollSync/domain/ScrollStateDetector';
import { ScrollVelocityService } from '../hooks/useManualScrollSync/domain/ScrollVelocityService';
import { createPathDomain } from '@/templating/domains/path';
import { ProgressInitializationService } from '../hooks/useScrollInitialization/domain/ProgressInitializationService';
import { useBreakpoint } from '@/hooks/useBreakpointValue';
import {
  SCROLL_INERTIA_FACTOR,
  SCROLL_EASING_TYPE,
  SCROLL_EASING_MIN_DELTA,
  SCROLL_VELOCITY_CONFIG,
} from '@/config';

/**
 * Type du contexte de scroll
 * Contient tous les services partagés pour le système de scroll
 */
export interface ScrollContextType {
  // Services de domaine
  easingService: ScrollEasingService;
  progressCalculator: ScrollProgressCalculator;
  stateDetector: ScrollStateDetector;
  velocityService: ScrollVelocityService;
  pathDomain: ReturnType<typeof createPathDomain>;
  progressInitService: ProgressInitializationService;

  // Configuration
  velocityConfig: {
    enabled: boolean;
    friction: number;
    maxVelocity: number;
    velocityToInertiaMultiplier: number;
    baseInertiaFactor: number;
  };

  // Utilitaires
  easingFunction: (t: number) => number;
  isDesktop: boolean;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

/**
 * Hook pour accéder au contexte de scroll
 * @throws Error si utilisé en dehors de ScrollProvider
 */
export const useScrollContext = (): ScrollContextType => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScrollContext must be used within ScrollProvider');
  }
  return context;
};

/**
 * Provider pour le contexte de scroll
 * Centralise tous les services et la configuration
 * Pattern identique à ModalProvider pour la cohérence
 */
export const ScrollContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isDesktop = useBreakpoint('>=desktop');

  // Configuration de vélocité selon mobile/desktop
  const velocityConfig = useMemo(() => {
    const config = isDesktop ? SCROLL_VELOCITY_CONFIG.desktop : SCROLL_VELOCITY_CONFIG.mobile;
    return {
      enabled: SCROLL_VELOCITY_CONFIG.enabled,
      ...config,
    };
  }, [isDesktop]);

  // Fonction d'easing
  const easingFunction = useMemo(() => {
    return EasingFunctions[SCROLL_EASING_TYPE] || EasingFunctions.linear;
  }, []);

  // Services de domaine (mémoïsés, créés une seule fois)
  const easingService = useMemo(
    () => new ScrollEasingService(SCROLL_INERTIA_FACTOR, easingFunction, SCROLL_EASING_MIN_DELTA),
    [easingFunction]
  );

  const progressCalculator = useMemo(() => new ScrollProgressCalculator(), []);

  const stateDetector = useMemo(() => new ScrollStateDetector(150), []);

  const velocityService = useMemo(
    () => new ScrollVelocityService(velocityConfig.friction, velocityConfig.maxVelocity),
    [velocityConfig.friction, velocityConfig.maxVelocity]
  );

  const pathDomain = useMemo(() => createPathDomain(), []);

  const progressInitService = useMemo(() => new ProgressInitializationService(), []);

  const value: ScrollContextType = useMemo(
    () => ({
      easingService,
      progressCalculator,
      stateDetector,
      velocityService,
      pathDomain,
      progressInitService,
      velocityConfig,
      easingFunction,
      isDesktop,
    }),
    [
      easingService,
      progressCalculator,
      stateDetector,
      velocityService,
      pathDomain,
      progressInitService,
      velocityConfig,
      easingFunction,
      isDesktop,
    ]
  );

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
};

