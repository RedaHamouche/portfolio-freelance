'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { createPageDomain } from '@/templating/domains/page';
import { createPathDomain } from '@/templating/domains/path';
import { createTangenteDomain } from '@/templating/domains/tangente';
import type { PageDomainAPI } from '@/templating/domains/page/api';
import type { PathDomainAPI } from '@/templating/domains/path/api';
import type { TangenteDomainAPI } from '@/templating/domains/tangente/api';

/**
 * Type du contexte de templating
 * Contient tous les domaines templating partagés
 */
export interface TemplatingContextType {
  pageDomain: PageDomainAPI;
  pathDomain: PathDomainAPI;
  tangenteDomain: TangenteDomainAPI;
}

const TemplatingContext = createContext<TemplatingContextType | undefined>(undefined);

/**
 * Hook pour accéder au contexte de templating
 * @throws Error si utilisé en dehors de TemplatingProvider
 */
export const useTemplatingContext = (): TemplatingContextType => {
  const context = useContext(TemplatingContext);
  if (!context) {
    throw new Error('useTemplatingContext must be used within TemplatingProvider');
  }
  return context;
};

/**
 * Provider pour le contexte de templating
 * Centralise tous les domaines templating pour éviter les duplications
 * Pattern identique à ScrollContext pour la cohérence
 */
export const TemplatingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Domaines templating (mémoïsés, créés une seule fois)
  const pageDomain = useMemo(() => createPageDomain(), []);
  const pathDomain = useMemo(() => createPathDomain(), []);
  const tangenteDomain = useMemo(() => createTangenteDomain(), []);

  const value: TemplatingContextType = useMemo(
    () => ({
      pageDomain,
      pathDomain,
      tangenteDomain,
    }),
    [pageDomain, pathDomain, tangenteDomain]
  );

  return <TemplatingContext.Provider value={value}>{children}</TemplatingContext.Provider>;
};

