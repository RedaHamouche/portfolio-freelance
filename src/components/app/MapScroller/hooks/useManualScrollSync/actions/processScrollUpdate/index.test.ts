import { processScrollUpdate } from './index';
import { ProgressUpdateService } from '@/components/app/MapScroller/services/ProgressUpdateService';
import { ScrollContextType } from '@/contexts/ScrollContext';
import { isBrowser } from '@/utils/ssr/isBrowser';
import { isValidPathLength } from '@/utils/validation/isValidPathLength';
import { ManualScrollSyncUseCase } from '@/components/app/MapScroller/hooks/useManualScrollSync/application/ManualScrollSyncUseCase';

// Mock dependencies
jest.mock('@/utils/ssr/isBrowser');
jest.mock('@/utils/validation/isValidPathLength');

describe('processScrollUpdate', () => {
  let context: ScrollContextType;
  let progressUpdateService: jest.Mocked<ProgressUpdateService>;
  let refs: {
    isInitializedRef: React.MutableRefObject<boolean>;
    lastInitializedPathLengthRef: React.MutableRefObject<number>;
    scrollYRef: React.MutableRefObject<number>;
    pendingUpdateRef: React.MutableRefObject<boolean>;
    rafIdRef: React.MutableRefObject<number | null>;
    isAutoPlayingRef: React.MutableRefObject<boolean>;
    lastScrollDirectionRef: React.MutableRefObject<string | null>;
  };
  let callbacks: {
    initializeUseCase: jest.Mock;
    getUseCase: jest.Mock;
    startEasingLoop: jest.Mock;
    updateScrollDirectionCallback: jest.Mock;
  };
  let mockUseCase: jest.Mocked<ManualScrollSyncUseCase>;

  beforeEach(() => {
    context = {
      velocityConfig: {
        enabled: true,
        friction: 0.95,
        maxVelocity: 10,
        velocityToInertiaMultiplier: 0.1,
        baseInertiaFactor: 0.12,
      },
    } as ScrollContextType;

    progressUpdateService = {
      updateProgressOnly: jest.fn(),
    } as unknown as jest.Mocked<ProgressUpdateService>;

    refs = {
      isInitializedRef: { current: false },
      lastInitializedPathLengthRef: { current: 0 },
      scrollYRef: { current: 0 },
      pendingUpdateRef: { current: false },
      rafIdRef: { current: null },
      isAutoPlayingRef: { current: false },
      lastScrollDirectionRef: { current: null },
    };

    mockUseCase = {
      updateVelocity: jest.fn(),
      updateScrollPosition: jest.fn().mockReturnValue({
        shouldCorrect: false,
      }),
      getCurrentProgress: jest.fn().mockReturnValue(0.5),
    } as unknown as jest.Mocked<ManualScrollSyncUseCase>;

    callbacks = {
      initializeUseCase: jest.fn(),
      getUseCase: jest.fn(() => mockUseCase),
      startEasingLoop: jest.fn(),
      updateScrollDirectionCallback: jest.fn(),
    };

    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 500,
    });

    (isBrowser as jest.Mock).mockReturnValue(true);
    (isValidPathLength as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('ne devrait rien faire si pas dans le navigateur', () => {
    (isBrowser as jest.Mock).mockReturnValue(false);

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, false);

    expect(callbacks.initializeUseCase).not.toHaveBeenCalled();
    expect(progressUpdateService.updateProgressOnly).not.toHaveBeenCalled();
  });

  it('devrait nettoyer les refs si la modal est ouverte', () => {
    refs.rafIdRef.current = 123;
    refs.pendingUpdateRef.current = true;

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, true);

    expect(refs.rafIdRef.current).toBeNull();
    expect(refs.pendingUpdateRef.current).toBe(false);
    expect(callbacks.initializeUseCase).not.toHaveBeenCalled();
  });

  it('devrait nettoyer les refs si globalPathLength est invalide', () => {
    (isValidPathLength as jest.Mock).mockReturnValue(false);
    refs.rafIdRef.current = 123;
    refs.pendingUpdateRef.current = true;

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 0, false);

    expect(refs.rafIdRef.current).toBeNull();
    expect(refs.pendingUpdateRef.current).toBe(false);
    expect(callbacks.initializeUseCase).not.toHaveBeenCalled();
  });

  it('devrait initialiser le useCase si pas encore initialisé', () => {
    refs.isInitializedRef.current = false;
    window.scrollY = 500;

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, false);

    expect(refs.scrollYRef.current).toBe(500);
    expect(callbacks.initializeUseCase).toHaveBeenCalledWith(1000);
    expect(refs.isInitializedRef.current).toBe(false); // initializeUseCase le met à true, mais on mock juste
  });

  it('devrait réinitialiser si pathLength a changé', () => {
    refs.isInitializedRef.current = true;
    refs.lastInitializedPathLengthRef.current = 500;
    window.scrollY = 600;

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, false);

    expect(refs.scrollYRef.current).toBe(600);
    expect(callbacks.initializeUseCase).toHaveBeenCalledWith(1000);
  });

  it('ne devrait pas réinitialiser si déjà initialisé avec le même pathLength', () => {
    refs.isInitializedRef.current = true;
    refs.lastInitializedPathLengthRef.current = 1000;

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, false);

    expect(callbacks.initializeUseCase).not.toHaveBeenCalled();
  });

  it('devrait mettre à jour la vélocité si activée', () => {
    refs.isInitializedRef.current = true;
    refs.lastInitializedPathLengthRef.current = 1000;
    refs.scrollYRef.current = 500;
    context.velocityConfig.enabled = true;

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, false);

    expect(mockUseCase.updateVelocity).toHaveBeenCalledWith(500);
  });

  it('ne devrait pas mettre à jour la vélocité si désactivée', () => {
    refs.isInitializedRef.current = true;
    refs.lastInitializedPathLengthRef.current = 1000;
    context.velocityConfig.enabled = false;

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, false);

    expect(mockUseCase.updateVelocity).not.toHaveBeenCalled();
  });

  it('devrait appeler updateScrollPosition sur le useCase', () => {
    refs.isInitializedRef.current = true;
    refs.lastInitializedPathLengthRef.current = 1000;
    refs.scrollYRef.current = 500;
    mockUseCase.updateScrollPosition.mockReturnValue({
      shouldCorrect: false,
    });

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, false);

    expect(mockUseCase.updateScrollPosition).toHaveBeenCalledWith(500, 1000);
  });

  it('devrait corriger le scroll si shouldCorrect est true', () => {
    const mockScrollTo = jest.fn();
    window.scrollTo = mockScrollTo;

    refs.isInitializedRef.current = true;
    refs.lastInitializedPathLengthRef.current = 1000;
    refs.scrollYRef.current = 500;
    mockUseCase.updateScrollPosition.mockReturnValue({
      shouldCorrect: true,
      correctionY: 600,
    });

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, false);

    expect(mockScrollTo).toHaveBeenCalledWith(0, 600);
  });

  it('ne devrait pas corriger le scroll si shouldCorrect est false', () => {
    const mockScrollTo = jest.fn();
    window.scrollTo = mockScrollTo;

    refs.isInitializedRef.current = true;
    refs.lastInitializedPathLengthRef.current = 1000;
    mockUseCase.updateScrollPosition.mockReturnValue({
      shouldCorrect: false,
    });

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, false);

    expect(mockScrollTo).not.toHaveBeenCalled();
  });

  it('devrait mettre à jour le progress via ProgressUpdateService', () => {
    refs.isInitializedRef.current = true;
    refs.lastInitializedPathLengthRef.current = 1000;
    mockUseCase.getCurrentProgress.mockReturnValue(0.75);

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, false);

    expect(progressUpdateService.updateProgressOnly).toHaveBeenCalledWith(0.75);
  });

  it('devrait appeler updateScrollDirectionCallback', () => {
    refs.isInitializedRef.current = true;
    refs.lastInitializedPathLengthRef.current = 1000;

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, false);

    expect(callbacks.updateScrollDirectionCallback).toHaveBeenCalledWith(mockUseCase);
  });

  it('devrait appeler startEasingLoop', () => {
    refs.isInitializedRef.current = true;
    refs.lastInitializedPathLengthRef.current = 1000;

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, false);

    expect(callbacks.startEasingLoop).toHaveBeenCalledTimes(1);
  });

  it('devrait nettoyer les refs à la fin', () => {
    refs.isInitializedRef.current = true;
    refs.lastInitializedPathLengthRef.current = 1000;
    refs.rafIdRef.current = 123;
    refs.pendingUpdateRef.current = true;

    processScrollUpdate(context, progressUpdateService, refs, callbacks, 1000, false);

    expect(refs.rafIdRef.current).toBeNull();
    expect(refs.pendingUpdateRef.current).toBe(false);
  });
});

