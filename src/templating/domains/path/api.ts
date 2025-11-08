/**
 * API du domaine Path
 * Interface pour interagir avec le domaine des composants de path
 */

import { PathComponent } from './types';
import { PathRepository } from './repository';
import { isComponentActive, findNextComponentInDirection, getNextAnchor, type PathComponentData } from '@/utils/pathCalculations';

export interface PathDomainAPI {
  /**
   * Charge tous les composants de path selon le breakpoint
   * @param isDesktop Si true, charge les composants desktop, sinon mobile
   */
  getAllComponents(isDesktop?: boolean): PathComponent[];

  /**
   * Récupère un composant par son ID selon le breakpoint
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   */
  getComponentById(id: string, isDesktop?: boolean): PathComponent | undefined;

  /**
   * Récupère un composant par son anchorId selon le breakpoint
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   */
  getComponentByAnchorId(anchorId: string, isDesktop?: boolean): PathComponent | undefined;

  /**
   * Récupère les composants actifs selon le progress actuel
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   */
  getActiveComponents(currentProgress: number, isDesktop?: boolean): PathComponent[];

  /**
   * Calcule la position d'un composant sur le path
   */
  calculateComponentPosition(
    component: PathComponent,
    getPointOnPath: (progress: number) => { x: number; y: number },
    paddingX: number,
    paddingY: number
  ): { x: number; y: number };

  /**
   * Trouve le prochain composant dans la direction du scroll
   * @param currentProgress Progress actuel (0-1)
   * @param direction Direction du scroll
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   */
  findNextComponentInDirection(
    currentProgress: number,
    direction: 'forward' | 'backward' | null,
    isDesktop?: boolean
  ): PathComponent | null;

  /**
   * Trouve le prochain anchor pour l'auto-scroll basé sur la direction
   * @param fromProgress Progress de départ
   * @param toProgress Progress d'arrivée
   * @param tolerance Tolérance pour la recherche
   * @param isDesktop Si true, cherche dans les composants desktop, sinon mobile
   */
  getNextAnchor(
    fromProgress: number,
    toProgress: number,
    tolerance?: number,
    isDesktop?: boolean
  ): PathComponent | null;
}

/**
 * Implémentation de l'API du domaine Path
 * Optimisé avec cache des arrays triés pour éviter les tris répétés
 */
export class PathDomain implements PathDomainAPI {
  private repository: PathRepository;
  
  // Cache des composants chargés (une fois pour desktop, une fois pour mobile)
  private componentsCache: {
    desktop?: PathComponent[];
    mobile?: PathComponent[];
  } = {};
  
  // Cache des arrays triés et des composants avec anchorId pour éviter les recalculs
  private sortedCache: {
    desktop?: {
      componentsWithAnchor: PathComponentData[];
      sortedAsc: PathComponentData[];
      sortedDesc: PathComponentData[];
    };
    mobile?: {
      componentsWithAnchor: PathComponentData[];
      sortedAsc: PathComponentData[];
      sortedDesc: PathComponentData[];
    };
  } = {};
  
  // OPTIMISATION: Cache pour getActiveComponents avec seuil de changement significatif
  private activeComponentsCache: {
    desktop?: {
      lastProgress: number;
      result: PathComponent[];
    };
    mobile?: {
      lastProgress: number;
      result: PathComponent[];
    };
  } = {};
  private readonly ACTIVE_COMPONENTS_PROGRESS_THRESHOLD = 0.001; // Seuil de changement significatif (0.1% du path)

  constructor(repository: PathRepository) {
    this.repository = repository;
  }

  /**
   * Récupère ou construit le cache des composants triés
   */
  private getSortedCache(isDesktop: boolean = true): {
    componentsWithAnchor: PathComponentData[];
    sortedAsc: PathComponentData[];
    sortedDesc: PathComponentData[];
  } {
    const cacheKey = isDesktop ? 'desktop' : 'mobile';
    let cache = this.sortedCache[cacheKey];
    
    if (!cache) {
      const components = this.repository.load(isDesktop);
      // Filtrer et convertir en PathComponentData
      const componentsWithAnchor: PathComponentData[] = components
        .filter(c => c.anchorId)
        .map(c => ({
          id: c.id,
          type: c.type,
          displayName: c.displayName,
          anchorId: c.anchorId!,
          position: { progress: c.position.progress },
          autoScrollPauseTime: c.autoScrollPauseTime,
        }));
      
      // Trier une seule fois et mettre en cache
      const sortedAsc = [...componentsWithAnchor].sort((a, b) => a.position.progress - b.position.progress);
      const sortedDesc = [...componentsWithAnchor].sort((a, b) => b.position.progress - a.position.progress);
      
      cache = {
        componentsWithAnchor,
        sortedAsc,
        sortedDesc,
      };
      
      this.sortedCache[cacheKey] = cache;
    }
    
    return cache;
  }

  /**
   * Invalide le cache (utile si les composants changent)
   */
  private invalidateCache(isDesktop?: boolean): void {
    if (isDesktop === undefined) {
      this.sortedCache = {};
    } else {
      const cacheKey = isDesktop ? 'desktop' : 'mobile';
      delete this.sortedCache[cacheKey];
    }
  }

  getAllComponents(isDesktop: boolean = true): PathComponent[] {
    // OPTIMISATION: Mettre en cache les composants (le JSON ne change pas après le chargement)
    const cacheKey = isDesktop ? 'desktop' : 'mobile';
    if (!this.componentsCache[cacheKey]) {
      this.componentsCache[cacheKey] = this.repository.load(isDesktop);
    }
    return this.componentsCache[cacheKey];
  }

  getComponentById(id: string, isDesktop: boolean = true): PathComponent | undefined {
    // Utiliser l'index du repository pour O(1) au lieu de O(n)
    return this.repository.getComponentById(id, isDesktop);
  }

  getComponentByAnchorId(anchorId: string, isDesktop: boolean = true): PathComponent | undefined {
    // Utiliser l'index du repository pour O(1) au lieu de O(n)
    return this.repository.getComponentByAnchorId(anchorId, isDesktop);
  }

  getActiveComponents(currentProgress: number, isDesktop: boolean = true): PathComponent[] {
    // OPTIMISATION: Utiliser le cache si le progress n'a pas changé significativement
    const cacheKey = isDesktop ? 'desktop' : 'mobile';
    const cached = this.activeComponentsCache[cacheKey];
    
    if (cached) {
      const progressDelta = Math.abs(currentProgress - cached.lastProgress);
      const wrappedDelta = Math.min(progressDelta, 1 - progressDelta); // Gérer wraparound
      
      // Si le changement est trop petit, utiliser le cache
      if (wrappedDelta < this.ACTIVE_COMPONENTS_PROGRESS_THRESHOLD) {
        return cached.result;
      }
    }
    
    // Recalculer si le changement est significatif
    const components = this.getAllComponents(isDesktop);
    const result = components.filter(c => 
      isComponentActive(c.position.progress, currentProgress)
    );
    
    // Mettre à jour le cache
    this.activeComponentsCache[cacheKey] = {
      lastProgress: currentProgress,
      result,
    };
    
    return result;
  }

  calculateComponentPosition(
    component: PathComponent,
    getPointOnPath: (progress: number) => { x: number; y: number },
    paddingX: number,
    paddingY: number
  ): { x: number; y: number } {
    const point = getPointOnPath(component.position.progress);
    return {
      x: point.x + paddingX,
      y: point.y + paddingY,
    };
  }

  findNextComponentInDirection(
    currentProgress: number,
    direction: 'forward' | 'backward' | null,
    isDesktop: boolean = true
  ): PathComponent | null {
    // Utiliser le cache des arrays triés pour éviter les tris répétés
    const cache = this.getSortedCache(isDesktop);
    
    // Utiliser findNextComponentInDirection avec les arrays triés en cache
    // Cela permet d'utiliser la recherche binaire optimisée
    const result = findNextComponentInDirection(
      currentProgress,
      direction,
      cache.componentsWithAnchor,
      cache.sortedAsc,
      cache.sortedDesc
    );
    
    // Convertir PathComponentData en PathComponent en récupérant le composant complet
    if (!result) return null;
    
    const fullComponent = this.getComponentById(result.id, isDesktop);
    return fullComponent ?? null;
  }

  getNextAnchor(
    fromProgress: number,
    toProgress: number,
    tolerance: number = 0.002,
    isDesktop: boolean = true
  ): PathComponent | null {
    // Utiliser le cache pour éviter les filtres/maps répétés
    const cache = this.getSortedCache(isDesktop);
    
    const result = getNextAnchor(fromProgress, toProgress, cache.componentsWithAnchor, tolerance);
    
    // Convertir PathComponentData en PathComponent
    if (!result) return null;
    
    const fullComponent = this.getComponentById(result.id, isDesktop);
    return fullComponent ?? null;
  }
}

