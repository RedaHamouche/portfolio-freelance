import { PathPositionCache, globalPathPositionCache } from './pathPositionCache';
import type { PointPosition } from '@/types/path';

describe('PathPositionCache', () => {
  let cache: PathPositionCache;

  beforeEach(() => {
    cache = new PathPositionCache(100); // Taille max de 100 pour les tests
  });

  afterEach(() => {
    cache.clear();
  });

  describe('getPosition / setPosition', () => {
    it('devrait retourner null pour une position non mise en cache', () => {
      const result = cache.getPosition(0.5, 1000);
      expect(result).toBeNull();
    });

    it('devrait mettre en cache et récupérer une position', () => {
      const position: PointPosition = { x: 100, y: 200 };
      cache.setPosition(0.5, 1000, position);

      const result = cache.getPosition(0.5, 1000);
      expect(result).toEqual(position);
    });

    it('devrait arrondir le progress à 4 décimales', () => {
      const position: PointPosition = { x: 100, y: 200 };
      cache.setPosition(0.123456789, 1000, position);

      // Devrait trouver avec un progress légèrement différent (mais arrondi pareil)
      const result = cache.getPosition(0.1234567, 1000);
      expect(result).toEqual(position);
    });

    it('ne devrait pas trouver une position avec un pathLength différent', () => {
      const position: PointPosition = { x: 100, y: 200 };
      cache.setPosition(0.5, 1000, position);

      const result = cache.getPosition(0.5, 2000);
      expect(result).toBeNull();
    });

    it('devrait mettre à jour le timestamp d\'accès (LRU)', () => {
      const position: PointPosition = { x: 100, y: 200 };
      cache.setPosition(0.5, 1000, position);

      // Accéder plusieurs fois - le cache devrait toujours fonctionner
      const result1 = cache.getPosition(0.5, 1000);
      const result2 = cache.getPosition(0.5, 1000);
      const result3 = cache.getPosition(0.5, 1000);
      
      // Le cache devrait toujours contenir l'entrée et retourner la même valeur
      expect(result1).toEqual(position);
      expect(result2).toEqual(position);
      expect(result3).toEqual(position);
    });
  });

  describe('getAngle / setAngle', () => {
    it('devrait retourner null pour un angle non mis en cache', () => {
      const result = cache.getAngle(0.5, 1000, 10);
      expect(result).toBeNull();
    });

    it('devrait mettre en cache et récupérer un angle', () => {
      const angle = 45.5;
      cache.setAngle(0.5, 1000, 10, angle);

      const result = cache.getAngle(0.5, 1000, 10);
      expect(result).toBe(angle);
    });

    it('ne devrait pas trouver un angle avec un delta différent', () => {
      const angle = 45.5;
      cache.setAngle(0.5, 1000, 10, angle);

      const result = cache.getAngle(0.5, 1000, 20);
      expect(result).toBeNull();
    });

    it('ne devrait pas trouver un angle avec un pathLength différent', () => {
      const angle = 45.5;
      cache.setAngle(0.5, 1000, 10, angle);

      const result = cache.getAngle(0.5, 2000, 10);
      expect(result).toBeNull();
    });
  });

  describe('invalidateByPathLength', () => {
    it('devrait invalider toutes les entrées pour un pathLength donné', () => {
      const position1: PointPosition = { x: 100, y: 200 };
      const position2: PointPosition = { x: 200, y: 300 };
      const angle1 = 45;
      const angle2 = 90;

      cache.setPosition(0.5, 1000, position1);
      cache.setPosition(0.6, 1000, position2);
      cache.setPosition(0.5, 2000, position1); // PathLength différent
      cache.setAngle(0.5, 1000, 10, angle1);
      cache.setAngle(0.6, 1000, 10, angle2);
      cache.setAngle(0.5, 2000, 10, angle1); // PathLength différent

      // Invalider pour pathLength 1000
      cache.invalidateByPathLength(1000);

      // Les entrées avec pathLength 1000 devraient être supprimées
      expect(cache.getPosition(0.5, 1000)).toBeNull();
      expect(cache.getPosition(0.6, 1000)).toBeNull();
      expect(cache.getAngle(0.5, 1000, 10)).toBeNull();
      expect(cache.getAngle(0.6, 1000, 10)).toBeNull();

      // Les entrées avec pathLength 2000 devraient toujours être là
      expect(cache.getPosition(0.5, 2000)).toEqual(position1);
      expect(cache.getAngle(0.5, 2000, 10)).toBe(angle1);
    });
  });

  describe('clear', () => {
    it('devrait vider complètement le cache', () => {
      cache.setPosition(0.5, 1000, { x: 100, y: 200 });
      cache.setAngle(0.5, 1000, 10, 45);

      cache.clear();

      expect(cache.getPosition(0.5, 1000)).toBeNull();
      expect(cache.getAngle(0.5, 1000, 10)).toBeNull();
    });
  });

  describe('eviction (LRU)', () => {
    let performanceNowSpy: jest.SpyInstance;

    beforeEach(() => {
      let time = 0;
      performanceNowSpy = jest.spyOn(performance, 'now').mockImplementation(() => {
        time += 1000; // Incrémenter de 1000ms à chaque appel
        return time;
      });
    });

    afterEach(() => {
      performanceNowSpy.mockRestore();
    });

    it('devrait évincer les entrées les plus anciennes quand le cache est plein', () => {
      const smallCache = new PathPositionCache(3); // Cache de taille 3

      // Ajouter 3 entrées avec des timestamps différents
      smallCache.setPosition(0.1, 1000, { x: 1, y: 1 }); // time = 1000

      smallCache.setPosition(0.2, 1000, { x: 2, y: 2 }); // time = 2000

      smallCache.setPosition(0.3, 1000, { x: 3, y: 3 }); // time = 3000

      // Accéder à la première pour la rendre "récente" (met à jour le timestamp)
      smallCache.getPosition(0.1, 1000); // time = 4000

      // Ajouter une 4ème entrée - devrait évincer la plus ancienne (0.2, qui n'a pas été accédée)
      smallCache.setPosition(0.4, 1000, { x: 4, y: 4 }); // time = 5000

      // 0.1 devrait toujours être là (récemment accédée à 4000)
      expect(smallCache.getPosition(0.1, 1000)).toEqual({ x: 1, y: 1 });
      // 0.2 devrait être évincée (timestamp 2000, jamais accédée)
      expect(smallCache.getPosition(0.2, 1000)).toBeNull();
      // 0.3 et 0.4 devraient être là
      expect(smallCache.getPosition(0.3, 1000)).toEqual({ x: 3, y: 3 });
      expect(smallCache.getPosition(0.4, 1000)).toEqual({ x: 4, y: 4 });
    });
  });

  describe('getStats', () => {
    it('devrait retourner les statistiques correctes du cache', () => {
      expect(cache.getStats()).toEqual({
        positionCacheSize: 0,
        angleCacheSize: 0,
      });

      cache.setPosition(0.5, 1000, { x: 100, y: 200 });
      cache.setPosition(0.6, 1000, { x: 200, y: 300 });
      cache.setAngle(0.5, 1000, 10, 45);

      expect(cache.getStats()).toEqual({
        positionCacheSize: 2,
        angleCacheSize: 1,
      });
    });
  });

  describe('globalPathPositionCache', () => {
    it('devrait être une instance singleton', () => {
      expect(globalPathPositionCache).toBeInstanceOf(PathPositionCache);
    });

    it('devrait fonctionner comme une instance normale', () => {
      const position: PointPosition = { x: 100, y: 200 };
      globalPathPositionCache.setPosition(0.5, 1000, position);

      const result = globalPathPositionCache.getPosition(0.5, 1000);
      expect(result).toEqual(position);

      // Nettoyer après le test
      globalPathPositionCache.clear();
    });
  });
});

