import { AutoPlayAnchorDetector } from './index';
import type { PathDomainAPI } from '@/templating/domains/path/api';
import { SCROLL_CONFIG } from '@/config';
import type { PathComponent } from '@/templating/domains/path/types';

describe('AutoPlayAnchorDetector', () => {
  let detector: AutoPlayAnchorDetector;
  let mockPathDomain: {
    getNextAnchor: jest.Mock;
  };

  beforeEach(() => {
    mockPathDomain = {
      getNextAnchor: jest.fn(),
    };
    detector = new AutoPlayAnchorDetector(mockPathDomain as unknown as PathDomainAPI);
  });

  describe('detectAnchor', () => {
    it('devrait retourner null si aucun anchor n\'est détecté', () => {
      mockPathDomain.getNextAnchor.mockReturnValue(null);
      
      const result = detector.detectAnchor(0.1, 0.2, true);
      
      expect(result).toBeNull();
      expect(mockPathDomain.getNextAnchor).toHaveBeenCalledWith(
        0.1,
        0.2,
        SCROLL_CONFIG.ANCHOR_TOLERANCE,
        true
      );
    });

    it('devrait retourner l\'anchor détecté', () => {
      const mockAnchor: PathComponent = {
        id: 'test-anchor',
        type: 'TestComponent',
        displayName: 'Test Anchor',
        anchorId: 'testAnchor',
        position: { progress: 0.15 },
        autoScrollPauseTime: 1000,
      };
      mockPathDomain.getNextAnchor.mockReturnValue(mockAnchor);
      
      const result = detector.detectAnchor(0.1, 0.2, true);
      
      expect(result).toEqual(mockAnchor);
      expect(mockPathDomain.getNextAnchor).toHaveBeenCalledWith(
        0.1,
        0.2,
        SCROLL_CONFIG.ANCHOR_TOLERANCE,
        true
      );
    });

    it('devrait utiliser isDesktop pour la détection', () => {
      mockPathDomain.getNextAnchor.mockReturnValue(null);
      
      detector.detectAnchor(0.1, 0.2, false);
      
      expect(mockPathDomain.getNextAnchor).toHaveBeenCalledWith(
        0.1,
        0.2,
        SCROLL_CONFIG.ANCHOR_TOLERANCE,
        false
      );
    });

    it('devrait gérer le wraparound (fromProgress > toProgress)', () => {
      mockPathDomain.getNextAnchor.mockReturnValue(null);
      
      detector.detectAnchor(0.9, 0.1, true);
      
      expect(mockPathDomain.getNextAnchor).toHaveBeenCalledWith(
        0.9,
        0.1,
        SCROLL_CONFIG.ANCHOR_TOLERANCE,
        true
      );
    });
  });
});

