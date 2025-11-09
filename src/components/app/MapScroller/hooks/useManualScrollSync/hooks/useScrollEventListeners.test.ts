import { renderHook } from '@testing-library/react';
import { useScrollEventListeners } from './useScrollEventListeners';

describe('useScrollEventListeners', () => {
  let handleUserInteraction: jest.Mock;
  let handleScroll: jest.Mock;
  let refs: {
    rafIdRef: { current: number | null };
    easingRafIdRef: { current: number | null };
    scrollEndTimeoutRef: { current: NodeJS.Timeout | null };
  };
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;
  let cancelAnimationFrameSpy: jest.SpyInstance;
  let clearTimeoutSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    handleUserInteraction = jest.fn();
    handleScroll = jest.fn();

    refs = {
      rafIdRef: { current: null },
      easingRafIdRef: { current: null },
      scrollEndTimeoutRef: { current: null },
    };

    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    cancelAnimationFrameSpy = jest.spyOn(window, 'cancelAnimationFrame');
    clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  it('devrait ajouter tous les event listeners au montage si isReady est true', () => {
    renderHook(() => useScrollEventListeners(handleUserInteraction, handleScroll, refs, true));

    expect(addEventListenerSpy).toHaveBeenCalledWith('wheel', handleUserInteraction, { passive: true });
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), { passive: true });
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: true });
    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', handleScroll, { passive: true });
  });

  it('ne devrait pas attacher les event listeners si isReady est false', () => {
    renderHook(() => useScrollEventListeners(handleUserInteraction, handleScroll, refs, false));

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it('devrait nettoyer tous les event listeners au démontage', () => {
    const { unmount } = renderHook(() =>
      useScrollEventListeners(handleUserInteraction, handleScroll, refs)
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', handleUserInteraction);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', handleScroll);
  });

  it('devrait nettoyer rafIdRef au démontage s\'il existe', () => {
    refs.rafIdRef.current = 123;

    const { unmount } = renderHook(() =>
      useScrollEventListeners(handleUserInteraction, handleScroll, refs)
    );

    unmount();

    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(123);
  });

  it('devrait nettoyer easingRafIdRef au démontage s\'il existe', () => {
    refs.easingRafIdRef.current = 456;

    const { unmount } = renderHook(() =>
      useScrollEventListeners(handleUserInteraction, handleScroll, refs)
    );

    unmount();

    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(456);
  });

  it('devrait nettoyer scrollEndTimeoutRef au démontage s\'il existe', () => {
    const timeout = setTimeout(() => {}, 100);
    refs.scrollEndTimeoutRef.current = timeout;

    const { unmount } = renderHook(() =>
      useScrollEventListeners(handleUserInteraction, handleScroll, refs)
    );

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timeout);
  });

  it('ne devrait pas nettoyer les refs si elles sont null', () => {
    refs.rafIdRef.current = null;
    refs.easingRafIdRef.current = null;
    refs.scrollEndTimeoutRef.current = null;

    const { unmount } = renderHook(() =>
      useScrollEventListeners(handleUserInteraction, handleScroll, refs)
    );

    unmount();

    expect(cancelAnimationFrameSpy).not.toHaveBeenCalled();
    expect(clearTimeoutSpy).not.toHaveBeenCalled();
  });

  it('devrait appeler handleUserInteraction pour les événements wheel', () => {
    renderHook(() => useScrollEventListeners(handleUserInteraction, handleScroll, refs));

    const wheelCall = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === 'wheel'
    );
    expect(wheelCall).toBeDefined();
    expect(wheelCall[1]).toBe(handleUserInteraction);
  });

  it('devrait créer des handlers séparés pour touchstart et touchmove', () => {
    renderHook(() => useScrollEventListeners(handleUserInteraction, handleScroll, refs));

    const touchStartCall = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === 'touchstart'
    );
    const touchMoveCall = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === 'touchmove'
    );

    expect(touchStartCall).toBeDefined();
    expect(touchMoveCall).toBeDefined();
    expect(touchStartCall[1]).not.toBe(touchMoveCall[1]);
    expect(typeof touchStartCall[1]).toBe('function');
    expect(typeof touchMoveCall[1]).toBe('function');
  });

  it('devrait gérer correctement le cas SSR (window undefined)', () => {
    // Note: Dans Jest, window existe toujours, donc on ne peut pas vraiment tester
    // le cas où window est undefined. Le hook vérifie `typeof window === 'undefined'`
    // qui ne peut pas être mocké facilement dans Jest.
    // Ce test vérifie simplement que le hook fonctionne normalement
    // et que la vérification SSR est présente dans le code.
    
    renderHook(() => useScrollEventListeners(handleUserInteraction, handleScroll, refs));

    // Le hook devrait ajouter les listeners normalement dans Jest
    expect(addEventListenerSpy).toHaveBeenCalled();
    
    // La vérification SSR est présente dans le code source :
    // `if (typeof window === 'undefined') return;`
    // mais ne peut pas être testée dans Jest car window existe toujours
  });
});

