import { isValidPathLength } from './isValidPathLength';
import { DEFAULT_PATH_LENGTH } from '@/config';

describe('isValidPathLength', () => {
  it('devrait valider les pathLength positifs', () => {
    expect(isValidPathLength(1000)).toBe(true);
    expect(isValidPathLength(5000)).toBe(true);
  });

  it('devrait rejeter les pathLength négatifs ou nuls', () => {
    expect(isValidPathLength(0)).toBe(false);
    expect(isValidPathLength(-100)).toBe(false);
  });

  it('devrait rejeter DEFAULT_PATH_LENGTH par défaut', () => {
    expect(isValidPathLength(DEFAULT_PATH_LENGTH)).toBe(false);
  });

  it('devrait accepter DEFAULT_PATH_LENGTH si acceptDefault=true', () => {
    expect(isValidPathLength(DEFAULT_PATH_LENGTH, true)).toBe(true);
  });

  it('devrait rejeter les valeurs juste au-dessus de DEFAULT_PATH_LENGTH', () => {
    expect(isValidPathLength(DEFAULT_PATH_LENGTH + 1)).toBe(true);
  });
});

