/**
 * Helper pour détecter le device côté serveur
 * Utilise le User-Agent pour déterminer si c'est mobile ou desktop
 * Évite le FOUC (Flash of Unstyled Content) et améliore les performances
 */

import { headers } from 'next/headers';

/**
 * Détecte si le device est mobile basé sur le User-Agent
 * Patterns communs pour mobile : Mobile, Android, iPhone, iPad, etc.
 */
function isMobileUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;
  
  const mobilePatterns = [
    /Mobile/i,
    /Android/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i,
    /Opera Mini/i,
    /IEMobile/i,
  ];
  
  return mobilePatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Détecte le device côté serveur
 * Utilise les headers HTTP pour déterminer mobile/desktop
 * 
 * @returns true si desktop, false si mobile
 */
export async function detectDeviceServerSide(): Promise<boolean> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  
  // Si pas de User-Agent, par défaut on considère desktop
  if (!userAgent) {
    return true;
  }
  
  const isMobile = isMobileUserAgent(userAgent);
  return !isMobile; // Retourne true si desktop, false si mobile
}

/**
 * Détecte le device côté serveur (version synchrone pour les Server Components)
 * Utilise les headers HTTP pour déterminer mobile/desktop
 * 
 * Note: Cette fonction doit être appelée dans un Server Component
 * 
 * @param userAgent User-Agent string depuis les headers
 * @returns true si desktop, false si mobile
 */
export function detectDeviceFromUserAgent(userAgent: string | null): boolean {
  if (!userAgent) {
    return true; // Par défaut desktop
  }
  
  const isMobile = isMobileUserAgent(userAgent);
  return !isMobile; // Retourne true si desktop, false si mobile
}

