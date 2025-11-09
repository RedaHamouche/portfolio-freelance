import modalReducer, { openModal, closeModal } from './index';

describe('modalSlice', () => {
  const initialState = {
    isOpen: false,
  };

  it('devrait retourner l\'état initial', () => {
    expect(modalReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('openModal', () => {
    it('devrait mettre isOpen à true', () => {
      const action = openModal();
      const state = modalReducer(initialState, action);
      expect(state.isOpen).toBe(true);
    });

    it('devrait mettre isOpen à true même si déjà ouvert', () => {
      const openedState = modalReducer(initialState, openModal());
      expect(openedState.isOpen).toBe(true);
      
      const action = openModal();
      const state = modalReducer(openedState, action);
      expect(state.isOpen).toBe(true);
    });
  });

  describe('closeModal', () => {
    it('devrait mettre isOpen à false', () => {
      const openedState = modalReducer(initialState, openModal());
      expect(openedState.isOpen).toBe(true);

      const action = closeModal();
      const state = modalReducer(openedState, action);
      expect(state.isOpen).toBe(false);
    });

    it('devrait rester à false si déjà fermé', () => {
      const action = closeModal();
      const state = modalReducer(initialState, action);
      expect(state.isOpen).toBe(false);
    });
  });

  describe('scénarios d\'utilisation', () => {
    it('devrait gérer l\'ouverture et la fermeture complète', () => {
      // État initial fermé
      let state = modalReducer(undefined, { type: 'unknown' });
      expect(state.isOpen).toBe(false);

      // Ouvrir la modal
      state = modalReducer(state, openModal());
      expect(state.isOpen).toBe(true);

      // Fermer la modal
      state = modalReducer(state, closeModal());
      expect(state.isOpen).toBe(false);

      // Rouvrir la modal
      state = modalReducer(state, openModal());
      expect(state.isOpen).toBe(true);
    });
  });
});

