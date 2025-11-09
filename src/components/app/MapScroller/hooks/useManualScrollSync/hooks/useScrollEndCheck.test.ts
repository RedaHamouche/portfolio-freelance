import { scheduleScrollEndCheck } from './useScrollEndCheck';
import type { ManualScrollSyncUseCase } from '../application/ManualScrollSyncUseCase';
import { SCROLL_CONFIG } from '@/config';

describe('scheduleScrollEndCheck', () => {
  let mockUseCase: jest.Mocked<ManualScrollSyncUseCase>;
  let scrollEndTimeoutRef: { current: NodeJS.Timeout | null };
  let onScrollState: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.clearAllTimers();

    mockUseCase = {
      checkScrollEnd: jest.fn().mockReturnValue(true),
    } as unknown as jest.Mocked<ManualScrollSyncUseCase>;

    scrollEndTimeoutRef = { current: null };
    onScrollState = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('devrait annuler le timeout précédent s\'il existe', () => {
    const previousTimeout = setTimeout(() => {}, 100);
    scrollEndTimeoutRef.current = previousTimeout;

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    scheduleScrollEndCheck(() => mockUseCase, onScrollState, scrollEndTimeoutRef);

    expect(clearTimeoutSpy).toHaveBeenCalledWith(previousTimeout);
    expect(scrollEndTimeoutRef.current).not.toBe(previousTimeout);

    clearTimeoutSpy.mockRestore();
  });

  it('devrait programmer la vérification après SCROLL_END_DELAY', () => {
    scheduleScrollEndCheck(() => mockUseCase, onScrollState, scrollEndTimeoutRef);

    expect(scrollEndTimeoutRef.current).not.toBe(null);
    expect(mockUseCase.checkScrollEnd).not.toHaveBeenCalled();

    jest.advanceTimersByTime(SCROLL_CONFIG.SCROLL_END_DELAY);

    expect(mockUseCase.checkScrollEnd).toHaveBeenCalled();
  });

  it('devrait appeler onScrollState(false) si le scroll est terminé', () => {
    mockUseCase.checkScrollEnd.mockReturnValue(true);

    scheduleScrollEndCheck(() => mockUseCase, onScrollState, scrollEndTimeoutRef);

    jest.advanceTimersByTime(SCROLL_CONFIG.SCROLL_END_DELAY);

    expect(onScrollState).toHaveBeenCalledWith(false);
  });

  it('ne devrait pas appeler onScrollState si le scroll n\'est pas terminé', () => {
    mockUseCase.checkScrollEnd.mockReturnValue(false);

    scheduleScrollEndCheck(() => mockUseCase, onScrollState, scrollEndTimeoutRef);

    jest.advanceTimersByTime(SCROLL_CONFIG.SCROLL_END_DELAY);

    expect(onScrollState).not.toHaveBeenCalled();
  });

  it('ne devrait pas appeler onScrollState si non fourni', () => {
    mockUseCase.checkScrollEnd.mockReturnValue(true);

    scheduleScrollEndCheck(() => mockUseCase, undefined, scrollEndTimeoutRef);

    jest.advanceTimersByTime(SCROLL_CONFIG.SCROLL_END_DELAY);

    expect(mockUseCase.checkScrollEnd).toHaveBeenCalled();
    // Pas d'erreur, juste pas d'appel à onScrollState
  });

  it('devrait réinitialiser scrollEndTimeoutRef après l\'exécution', () => {
    scheduleScrollEndCheck(() => mockUseCase, onScrollState, scrollEndTimeoutRef);

    expect(scrollEndTimeoutRef.current).not.toBe(null);

    jest.advanceTimersByTime(SCROLL_CONFIG.SCROLL_END_DELAY);

    expect(scrollEndTimeoutRef.current).toBe(null);
  });

  it('devrait remplacer le timeout précédent si appelé plusieurs fois', () => {
    const firstTimeout = setTimeout(() => {}, 100);
    scrollEndTimeoutRef.current = firstTimeout;

    scheduleScrollEndCheck(() => mockUseCase, onScrollState, scrollEndTimeoutRef);
    const secondTimeout = scrollEndTimeoutRef.current;

    scheduleScrollEndCheck(() => mockUseCase, onScrollState, scrollEndTimeoutRef);
    const thirdTimeout = scrollEndTimeoutRef.current;

    expect(secondTimeout).not.toBe(thirdTimeout);
    expect(scrollEndTimeoutRef.current).not.toBe(null);
  });
});

