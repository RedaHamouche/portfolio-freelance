import cursorReducer, { setClickable, setDirection } from './cursorSlice';

describe('cursorSlice', () => {
  const initialState = {
    isClickable: false,
    direction: '',
  };

  it('devrait retourner l\'état initial', () => {
    expect(cursorReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setClickable', () => {
    it('devrait mettre à jour isClickable à true', () => {
      const action = setClickable(true);
      const state = cursorReducer(initialState, action);
      expect(state.isClickable).toBe(true);
    });

    it('devrait mettre à jour isClickable à false', () => {
      const action = setClickable(false);
      const state = cursorReducer(initialState, action);
      expect(state.isClickable).toBe(false);
    });
  });

  describe('setDirection', () => {
    it('devrait mettre à jour direction', () => {
      const action = setDirection('right');
      const state = cursorReducer(initialState, action);
      expect(state.direction).toBe('right');
    });

    it('devrait accepter une chaîne vide', () => {
      const action = setDirection('');
      const state = cursorReducer(initialState, action);
      expect(state.direction).toBe('');
    });
  });
});

