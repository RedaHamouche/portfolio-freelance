/**
 * Tests pour ProgressPersistenceService
 */

import { ProgressPersistenceService } from './index';

describe('ProgressPersistenceService', () => {
  let service: ProgressPersistenceService;
  const STORAGE_KEY = 'scrollProgress';

  beforeEach(() => {
    service = new ProgressPersistenceService();
    // Nettoyer le localStorage avant chaque test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveProgress', () => {
    it('devrait sauvegarder un progress valide', () => {
      service.saveProgress(0.5);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('0.5');
    });

    it('devrait sauvegarder progress = 0', () => {
      service.saveProgress(0);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('0');
    });

    it('devrait sauvegarder progress = 1', () => {
      service.saveProgress(1);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('1');
    });

    it('ne devrait pas sauvegarder un progress < 0', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      service.saveProgress(-0.1);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      consoleSpy.mockRestore();
    });

    it('ne devrait pas sauvegarder un progress > 1', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      service.saveProgress(1.1);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('getProgress', () => {
    it('devrait retourner null si aucun progress sauvegardé', () => {
      expect(service.getProgress()).toBeNull();
    });

    it('devrait récupérer un progress valide', () => {
      localStorage.setItem(STORAGE_KEY, '0.75');
      expect(service.getProgress()).toBe(0.75);
    });

    it('devrait retourner null et nettoyer si le progress est invalide (NaN)', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid');
      expect(service.getProgress()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('devrait retourner null et nettoyer si le progress est < 0', () => {
      localStorage.setItem(STORAGE_KEY, '-0.1');
      expect(service.getProgress()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('devrait retourner null et nettoyer si le progress est > 1', () => {
      localStorage.setItem(STORAGE_KEY, '1.5');
      expect(service.getProgress()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('devrait gérer les erreurs de localStorage gracieusement', () => {
      // Simuler une erreur de localStorage
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      expect(service.getProgress()).toBeNull();
      
      getItemSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('clearProgress', () => {
    it('devrait supprimer le progress du localStorage', () => {
      localStorage.setItem(STORAGE_KEY, '0.5');
      service.clearProgress();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('ne devrait pas lever d\'erreur si aucun progress n\'existe', () => {
      expect(() => service.clearProgress()).not.toThrow();
    });
  });

  describe('hasProgress', () => {
    it('devrait retourner false si aucun progress sauvegardé', () => {
      expect(service.hasProgress()).toBe(false);
    });

    it('devrait retourner true si un progress valide est sauvegardé', () => {
      localStorage.setItem(STORAGE_KEY, '0.5');
      expect(service.hasProgress()).toBe(true);
    });

    it('devrait retourner false si le progress est invalide', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid');
      expect(service.hasProgress()).toBe(false);
    });
  });
});

