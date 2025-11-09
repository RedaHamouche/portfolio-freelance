import { createAutoPlayUseCase } from './index';
import { createPathDomain } from '@/templating/domains/path';
import { AutoPlayUseCase } from '../../application';

describe('createAutoPlayUseCase', () => {
  it('devrait créer une instance de AutoPlayUseCase', () => {
    const pathDomain = createPathDomain();
    const useCase = createAutoPlayUseCase(pathDomain);

    expect(useCase).toBeInstanceOf(AutoPlayUseCase);
  });

  it('devrait créer une nouvelle instance à chaque appel', () => {
    const pathDomain = createPathDomain();
    const useCase1 = createAutoPlayUseCase(pathDomain);
    const useCase2 = createAutoPlayUseCase(pathDomain);

    expect(useCase1).not.toBe(useCase2);
  });

  it('devrait créer une instance avec tous les services nécessaires', () => {
    const pathDomain = createPathDomain();
    const useCase = createAutoPlayUseCase(pathDomain);

    // Vérifier que l'instance peut être utilisée (pas d'erreur lors de l'appel à animate)
    const result = useCase.animate({
      isAutoPlaying: true,
      currentProgress: 0.5,
      direction: 1,
      dt: 0.016,
      isDesktop: true,
      isPaused: false,
      lastPausedAnchorId: null,
    });

    expect(result).not.toBeNull();
    expect(result?.newProgress).toBeGreaterThanOrEqual(0);
    expect(result?.newProgress).toBeLessThanOrEqual(1);
  });
});

