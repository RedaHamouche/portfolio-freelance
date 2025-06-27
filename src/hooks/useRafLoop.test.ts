import { renderHook, act } from '@testing-library/react';
import { useRafLoop } from './useRafLoop';

jest.useFakeTimers();

describe('useRafLoop', () => {
  it('appelle la callback à chaque frame tant que start est appelé', () => {
    const cb = jest.fn();
    const { result } = renderHook(() => useRafLoop());

    act(() => {
      result.current.start(cb);
    });

    // Simule 3 frames
    for (let i = 0; i < 3; i++) {
      act(() => {
        // @ts-expect-error - Mocking requestAnimationFrame
        window.requestAnimationFrame.mock.calls[i][0](performance.now());
      });
    }

    expect(cb).toHaveBeenCalledTimes(3);

    act(() => {
      result.current.stop();
    });
  });

  it("n'appelle plus la callback après stop", () => {
    const cb = jest.fn();
    const { result } = renderHook(() => useRafLoop());

    act(() => {
      result.current.start(cb);
    });

    act(() => {
      // @ts-expect-error - Mocking requestAnimationFrame
      window.requestAnimationFrame.mock.calls[0][0](performance.now());
    });

    act(() => {
      result.current.stop();
    });

    // Simule une frame supplémentaire
    act(() => {
      // @ts-expect-error - Mocking requestAnimationFrame
      window.requestAnimationFrame.mock.calls[1][0](performance.now());
    });

    expect(cb).toHaveBeenCalledTimes(1);
  });
}); 