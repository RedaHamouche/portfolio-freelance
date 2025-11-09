/**
 * Service de cache pour les positions et angles calculés sur les paths SVG.
 * 
 * Ce cache évite les recalculs coûteux de `getPointAtLength()` en stockant
 * les résultats pour des combinaisons de (progress, pathLength, delta).
 * 
 * Le cache utilise une précision de 4 décimales pour le progress (0.0001)
 * pour équilibrer la précision et la taille du cache.
 */

import type { PointPosition } from '@/utils/pathCalculations/types';

interface CacheEntry<T> {
  value: T;
  lastAccessed: number; // Timestamp en millisecondes depuis le chargement de la page (performance.now())
}

/**
 * Service de cache pour les positions et angles de path.
 * 
 * Utilise une stratégie LRU simple avec limite de taille.
 */
export class PathPositionCache {
  private readonly positionCache = new Map<string, CacheEntry<PointPosition>>();
  private readonly angleCache = new Map<string, CacheEntry<number>>();
  private readonly maxCacheSize: number;
  private readonly progressPrecision: number = 10000; // 4 décimales (10^4)

  /**
   * @param maxCacheSize Nombre maximum d'entrées par cache (défaut: 1000)
   */
  constructor(maxCacheSize: number = 1000) {
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Arrondit un progress à la précision du cache.
   */
  private roundProgress(progress: number): number {
    return Math.round(progress * this.progressPrecision) / this.progressPrecision;
  }

  /**
   * Génère une clé de cache à partir des paramètres.
   */
  private generateKey(progress: number, pathLength: number, delta?: number): string {
    const roundedProgress = this.roundProgress(progress);
    if (delta !== undefined) {
      return `${roundedProgress}:${pathLength}:${delta}`;
    }
    return `${roundedProgress}:${pathLength}`;
  }

  /**
   * Nettoie le cache en supprimant les entrées les plus anciennes si nécessaire.
   */
  private evictIfNeeded<T>(cache: Map<string, CacheEntry<T>>): void {
    if (cache.size < this.maxCacheSize) {
      return;
    }

    // Trouver l'entrée la plus ancienne
    let oldestKey: string | null = null;
    let oldestTime = performance.now();

    for (const [key, entry] of cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  /**
   * Récupère une position depuis le cache.
   * 
   * @param progress Progress (0-1)
   * @param pathLength Longueur totale du path
   * @returns Position mise en cache ou null si non trouvée
   */
  getPosition(progress: number, pathLength: number): PointPosition | null {
    const key = this.generateKey(progress, pathLength);
    const entry = this.positionCache.get(key);

    if (!entry) {
      return null;
    }

    // Mettre à jour le timestamp d'accès (LRU)
    entry.lastAccessed = performance.now();
    return entry.value;
  }

  /**
   * Stocke une position dans le cache.
   * 
   * @param progress Progress (0-1)
   * @param pathLength Longueur totale du path
   * @param position Position à mettre en cache
   */
  setPosition(progress: number, pathLength: number, position: PointPosition): void {
    const key = this.generateKey(progress, pathLength);
    
    // Évincer si nécessaire avant d'ajouter
    this.evictIfNeeded(this.positionCache);

    this.positionCache.set(key, {
      value: position,
      lastAccessed: performance.now(),
    });
  }

  /**
   * Récupère un angle depuis le cache.
   * 
   * @param progress Progress (0-1)
   * @param pathLength Longueur totale du path
   * @param delta Delta utilisé pour le calcul de tangente
   * @returns Angle mis en cache ou null si non trouvé
   */
  getAngle(progress: number, pathLength: number, delta: number): number | null {
    const key = this.generateKey(progress, pathLength, delta);
    const entry = this.angleCache.get(key);

    if (!entry) {
      return null;
    }

    // Mettre à jour le timestamp d'accès (LRU)
    entry.lastAccessed = performance.now();
    return entry.value;
  }

  /**
   * Stocke un angle dans le cache.
   * 
   * @param progress Progress (0-1)
   * @param pathLength Longueur totale du path
   * @param delta Delta utilisé pour le calcul de tangente
   * @param angle Angle à mettre en cache
   */
  setAngle(progress: number, pathLength: number, delta: number, angle: number): void {
    const key = this.generateKey(progress, pathLength, delta);
    
    // Évincer si nécessaire avant d'ajouter
    this.evictIfNeeded(this.angleCache);

    this.angleCache.set(key, {
      value: angle,
      lastAccessed: performance.now(),
    });
  }

  /**
   * Invalide toutes les entrées du cache pour un pathLength donné.
   * Utile quand le path change de longueur.
   * 
   * @param pathLength Longueur du path à invalider
   */
  invalidateByPathLength(pathLength: number): void {
    // Invalider les positions
    for (const key of this.positionCache.keys()) {
      if (key.endsWith(`:${pathLength}`)) {
        this.positionCache.delete(key);
      }
    }

    // Invalider les angles
    for (const key of this.angleCache.keys()) {
      if (key.includes(`:${pathLength}:`)) {
        this.angleCache.delete(key);
      }
    }
  }

  /**
   * Vide complètement le cache.
   */
  clear(): void {
    this.positionCache.clear();
    this.angleCache.clear();
  }

  /**
   * Retourne les statistiques du cache.
   */
  getStats(): { positionCacheSize: number; angleCacheSize: number } {
    return {
      positionCacheSize: this.positionCache.size,
      angleCacheSize: this.angleCache.size,
    };
  }
}

/**
 * Instance singleton du cache pour utilisation globale.
 * 
 * Note: En production, on pourrait vouloir une instance par path
 * pour éviter les collisions entre différents paths.
 */
export const globalPathPositionCache = new PathPositionCache();

