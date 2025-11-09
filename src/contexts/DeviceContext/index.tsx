'use client';

import React, { createContext, useContext, ReactNode } from 'react';

/**
 * Type du contexte device
 */
export interface DeviceContextType {
  isDesktop: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

/**
 * Hook pour accéder au contexte device
 * @throws Error si utilisé en dehors de DeviceProvider
 */
export const useDevice = (): DeviceContextType => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within DeviceProvider');
  }
  return context;
};

/**
 * Hook sécurisé pour accéder au contexte device avec fallback
 * Utilise window.innerWidth si le contexte n'est pas disponible
 * Utile pour les composants qui peuvent être utilisés en dehors du DeviceProvider
 */
export const useDeviceSafe = (): DeviceContextType => {
  const context = useContext(DeviceContext);
  
  // Si le contexte est disponible, l'utiliser
  if (context) {
    return context;
  }
  
  // Sinon, fallback sur window.innerWidth
  if (typeof window !== 'undefined') {
    const isDesktop = window.innerWidth >= 1024; // Desktop breakpoint
    return { isDesktop };
  }
  
  // Par défaut desktop côté serveur
  return { isDesktop: true };
};

/**
 * Provider pour le contexte device
 * Fournit isDesktop pré-détecté côté serveur pour éviter le FOUC
 */
interface DeviceProviderProps {
  children: ReactNode;
  isDesktop: boolean;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({
  children,
  isDesktop,
}) => {
  const value: DeviceContextType = {
    isDesktop,
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
};

