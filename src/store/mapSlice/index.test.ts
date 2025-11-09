import mapReducer, { setMapSize } from './index';

describe('mapSlice', () => {
  const initialState = {
    mapWidth: 3000,
    mapHeight: 2000,
  };

  it('devrait retourner l\'état initial', () => {
    expect(mapReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setMapSize', () => {
    it('devrait mettre à jour mapWidth et mapHeight', () => {
      const action = setMapSize({ width: 5000, height: 4000 });
      const state = mapReducer(initialState, action);
      expect(state.mapWidth).toBe(5000);
      expect(state.mapHeight).toBe(4000);
    });

    it('devrait accepter des valeurs différentes', () => {
      const action = setMapSize({ width: 1920, height: 1080 });
      const state = mapReducer(initialState, action);
      expect(state.mapWidth).toBe(1920);
      expect(state.mapHeight).toBe(1080);
    });
  });
});

