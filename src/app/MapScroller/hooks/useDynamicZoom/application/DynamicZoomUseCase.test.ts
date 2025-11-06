import { DynamicZoomUseCase } from './DynamicZoomUseCase';
import { ZoomService } from '../domain/ZoomService';

describe('DynamicZoomUseCase', () => {
  let useCase: DynamicZoomUseCase;
  let zoomService: ZoomService;
  const baseScale = 1.0;

  beforeEach(() => {
    zoomService = new ZoomService(0.1);
    useCase = new DynamicZoomUseCase(zoomService);
  });

  describe('updateScrollState', () => {
    it('devrait mettre à jour l\'état du scroll', () => {
      useCase.updateScrollState(true);
      expect(useCase.getCurrentZoom(baseScale)).toBe(baseScale * 0.9);
    });

    it('devrait calculer le zoom correctement quand isScrolling change', () => {
      useCase.updateScrollState(true);
      expect(useCase.getCurrentZoom(baseScale)).toBe(baseScale * 0.9);

      useCase.updateScrollState(false);
      expect(useCase.getCurrentZoom(baseScale)).toBe(baseScale);
    });
  });

  describe('getCurrentZoom', () => {
    it('devrait retourner le zoom de base quand pas de scroll', () => {
      useCase.updateScrollState(false);
      expect(useCase.getCurrentZoom(baseScale)).toBe(baseScale);
    });

    it('devrait retourner le zoom réduit pendant le scroll', () => {
      useCase.updateScrollState(true);
      expect(useCase.getCurrentZoom(baseScale)).toBe(baseScale * 0.9);
    });

    it('devrait gérer différents scales de base', () => {
      const customScale = 2.5;
      useCase.updateScrollState(true);
      expect(useCase.getCurrentZoom(customScale)).toBe(customScale * 0.9);
    });
  });

  describe('isScrolling', () => {
    it('devrait retourner false par défaut', () => {
      expect(useCase.isScrolling()).toBe(false);
    });

    it('devrait retourner true après updateScrollState(true)', () => {
      useCase.updateScrollState(true);
      expect(useCase.isScrolling()).toBe(true);
    });

    it('devrait retourner false après updateScrollState(false)', () => {
      useCase.updateScrollState(true);
      useCase.updateScrollState(false);
      expect(useCase.isScrolling()).toBe(false);
    });
  });
});

