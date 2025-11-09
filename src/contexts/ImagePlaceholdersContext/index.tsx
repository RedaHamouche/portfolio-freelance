'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { ImagePlaceholders } from '@/utils/ssr/loadServerConfigs';

/**
 * Type du contexte des placeholders d'images
 */
export interface ImagePlaceholdersContextType {
  placeholders: ImagePlaceholders;
  getPlaceholder: (componentId: string) => {
    blurDataURL?: string;
    mobileBlurDataURL?: string;
    desktopBlurDataURL?: string;
  } | undefined;
}

const ImagePlaceholdersContext = createContext<ImagePlaceholdersContextType | undefined>(
  undefined
);

/**
 * Hook pour accéder au contexte des placeholders d'images
 * @throws Error si utilisé en dehors de ImagePlaceholdersProvider
 */
export const useImagePlaceholders = (): ImagePlaceholdersContextType => {
  const context = useContext(ImagePlaceholdersContext);
  if (!context) {
    throw new Error('useImagePlaceholders must be used within ImagePlaceholdersProvider');
  }
  return context;
};

/**
 * Hook sécurisé pour accéder au contexte des placeholders d'images avec fallback
 * Retourne un contexte vide si le provider n'est pas disponible
 */
export const useImagePlaceholdersSafe = (): ImagePlaceholdersContextType => {
  const context = useContext(ImagePlaceholdersContext);
  
  // Si le contexte est disponible, l'utiliser
  if (context) {
    return context;
  }
  
  // Sinon, retourner un contexte vide
  return {
    placeholders: {},
    getPlaceholder: () => undefined,
  };
};

/**
 * Provider pour les placeholders d'images
 * Fournit les blurDataURL pré-générés côté serveur
 */
interface ImagePlaceholdersProviderProps {
  children: ReactNode;
  placeholders: ImagePlaceholders;
}

export const ImagePlaceholdersProvider: React.FC<ImagePlaceholdersProviderProps> = ({
  children,
  placeholders,
}) => {
  const getPlaceholder = (componentId: string) => {
    return placeholders[componentId];
  };

  const value: ImagePlaceholdersContextType = {
    placeholders,
    getPlaceholder,
  };

  return (
    <ImagePlaceholdersContext.Provider value={value}>{children}</ImagePlaceholdersContext.Provider>
  );
};

