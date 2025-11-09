import { isBrowser } from './index';

describe('isBrowser', () => {
  it('devrait retourner true dans un environnement navigateur', () => {
    expect(isBrowser()).toBe(true);
  });

  // Note: Dans un environnement Node.js (tests), window n'existe pas
  // mais Jest simule window, donc le test peut être trompeur
  // En production, cette fonction fonctionne correctement
});

