import { AutoPlayPauseService } from './AutoPlayPauseService';

describe('AutoPlayPauseService', () => {
  let service: AutoPlayPauseService;

  beforeEach(() => {
    service = new AutoPlayPauseService();
  });

  describe('getPauseDuration', () => {
    it('devrait retourner 1000ms (1s) par défaut si autoScrollPauseTime n\'est pas défini', () => {
      const anchor = { anchorId: 'test', autoScrollPauseTime: undefined };
      const result = service.getPauseDuration(anchor);
      expect(result).toBe(1000);
    });

    it('devrait retourner 1000ms (1s) par défaut si autoScrollPauseTime est 0', () => {
      const anchor = { anchorId: 'test', autoScrollPauseTime: 0 };
      const result = service.getPauseDuration(anchor);
      expect(result).toBe(1000);
    });

    it('devrait retourner 1000ms (1s) par défaut si autoScrollPauseTime est négatif', () => {
      const anchor = { anchorId: 'test', autoScrollPauseTime: -100 };
      const result = service.getPauseDuration(anchor);
      expect(result).toBe(1000);
    });

    it('devrait retourner autoScrollPauseTime si défini et positif', () => {
      const anchor = { anchorId: 'test', autoScrollPauseTime: 2000 };
      const result = service.getPauseDuration(anchor);
      expect(result).toBe(2000);
    });

    it('devrait retourner autoScrollPauseTime si défini et positif (cas 500ms)', () => {
      const anchor = { anchorId: 'test', autoScrollPauseTime: 500 };
      const result = service.getPauseDuration(anchor);
      expect(result).toBe(500);
    });
  });

  describe('shouldPause', () => {
    it('devrait retourner true si l\'anchor a un autoScrollPauseTime valide', () => {
      const anchor = { anchorId: 'test', autoScrollPauseTime: 1000 };
      expect(service.shouldPause(anchor)).toBe(true);
    });

    it('devrait retourner false si autoScrollPauseTime est 0', () => {
      const anchor = { anchorId: 'test', autoScrollPauseTime: 0 };
      expect(service.shouldPause(anchor)).toBe(false);
    });

    it('devrait retourner false si autoScrollPauseTime est négatif', () => {
      const anchor = { anchorId: 'test', autoScrollPauseTime: -100 };
      expect(service.shouldPause(anchor)).toBe(false);
    });

    it('devrait retourner true si autoScrollPauseTime n\'est pas défini (pause par défaut 1s)', () => {
      const anchor = { anchorId: 'test', autoScrollPauseTime: undefined };
      expect(service.shouldPause(anchor)).toBe(true);
    });
  });
});

