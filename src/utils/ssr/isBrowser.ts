/**
 * Vérifie si le code s'exécute dans un environnement navigateur
 * Utilisé pour éviter les erreurs SSR (Server-Side Rendering)
 * 
 * @returns true si on est dans un navigateur, false sinon
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

