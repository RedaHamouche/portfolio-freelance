import scrollReducer, {
  setIsScrolling,
  setScrollingSpeed,
  setDirection,
  resetDirection,
  setAutoPlaying,
  setProgress,
  setPathLength,
  setAutoScrollDirection,
  setAutoScrollTemporarilyPaused,
} from './scrollSlice';

describe('scrollSlice', () => {
  const initialState = {
    isScrolling: false,
    scrollingSpeed: 20,
    direction: null as string | null,
    isAutoPlaying: false,
    progress: 0,
    pathLength: 2000,
    autoScrollDirection: 1,
    isAutoScrollTemporarilyPaused: false,
  };

  it('devrait retourner l\'état initial', () => {
    expect(scrollReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setIsScrolling', () => {
    it('devrait mettre à jour isScrolling à true', () => {
      const action = setIsScrolling(true);
      const state = scrollReducer(initialState, action);
      expect(state.isScrolling).toBe(true);
    });

    it('devrait mettre à jour isScrolling à false', () => {
      const action = setIsScrolling(false);
      const state = scrollReducer(initialState, action);
      expect(state.isScrolling).toBe(false);
    });
  });

  describe('setScrollingSpeed', () => {
    it('devrait mettre à jour scrollingSpeed', () => {
      const action = setScrollingSpeed(50);
      const state = scrollReducer(initialState, action);
      expect(state.scrollingSpeed).toBe(50);
    });
  });

  describe('setDirection', () => {
    it('devrait mettre à jour direction et isScrolling', () => {
      const action = setDirection('bas');
      const state = scrollReducer(initialState, action);
      expect(state.direction).toBe('bas');
      expect(state.isScrolling).toBe(true);
    });

    it('devrait mettre isScrolling à false si direction est null', () => {
      const action = setDirection(null);
      const state = scrollReducer(initialState, action);
      expect(state.direction).toBe(null);
      expect(state.isScrolling).toBe(false);
    });
  });

  describe('resetDirection', () => {
    it('devrait réinitialiser direction et isScrolling', () => {
      const stateWithDirection = scrollReducer(initialState, setDirection('haut'));
      expect(stateWithDirection.direction).toBe('haut');
      
      const action = resetDirection();
      const state = scrollReducer(stateWithDirection, action);
      expect(state.direction).toBe(null);
      expect(state.isScrolling).toBe(false);
    });
  });

  describe('setAutoPlaying', () => {
    it('devrait mettre à jour isAutoPlaying à true', () => {
      const action = setAutoPlaying(true);
      const state = scrollReducer(initialState, action);
      expect(state.isAutoPlaying).toBe(true);
    });

    it('devrait mettre à jour isAutoPlaying à false', () => {
      const action = setAutoPlaying(false);
      const state = scrollReducer(initialState, action);
      expect(state.isAutoPlaying).toBe(false);
    });
  });

  describe('setProgress', () => {
    it('devrait mettre à jour progress', () => {
      const action = setProgress(0.5);
      const state = scrollReducer(initialState, action);
      expect(state.progress).toBe(0.5);
    });

    it('devrait accepter progress = 0', () => {
      const action = setProgress(0);
      const state = scrollReducer(initialState, action);
      expect(state.progress).toBe(0);
    });

    it('devrait accepter progress = 1', () => {
      const action = setProgress(1);
      const state = scrollReducer(initialState, action);
      expect(state.progress).toBe(1);
    });
  });

  describe('setPathLength', () => {
    it('devrait mettre à jour pathLength', () => {
      const action = setPathLength(3000);
      const state = scrollReducer(initialState, action);
      expect(state.pathLength).toBe(3000);
    });
  });

  describe('setAutoScrollDirection', () => {
    it('devrait mettre à jour autoScrollDirection à 1', () => {
      const action = setAutoScrollDirection(1);
      const state = scrollReducer(initialState, action);
      expect(state.autoScrollDirection).toBe(1);
    });

    it('devrait mettre à jour autoScrollDirection à -1', () => {
      const action = setAutoScrollDirection(-1);
      const state = scrollReducer(initialState, action);
      expect(state.autoScrollDirection).toBe(-1);
    });
  });

  describe('setAutoScrollTemporarilyPaused', () => {
    it('devrait mettre à jour isAutoScrollTemporarilyPaused à true', () => {
      const action = setAutoScrollTemporarilyPaused(true);
      const state = scrollReducer(initialState, action);
      expect(state.isAutoScrollTemporarilyPaused).toBe(true);
    });

    it('devrait mettre à jour isAutoScrollTemporarilyPaused à false', () => {
      const action = setAutoScrollTemporarilyPaused(false);
      const state = scrollReducer(initialState, action);
      expect(state.isAutoScrollTemporarilyPaused).toBe(false);
    });
  });
});

