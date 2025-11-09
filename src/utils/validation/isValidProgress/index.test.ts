import { isValidProgress } from './index';

describe('isValidProgress', () => {
  it('devrait valider les progress dans [0, 1]', () => {
    expect(isValidProgress(0)).toBe(true);
    expect(isValidProgress(0.5)).toBe(true);
    expect(isValidProgress(1)).toBe(true);
  });

  it('devrait rejeter les progress hors de [0, 1]', () => {
    expect(isValidProgress(-0.1)).toBe(false);
    expect(isValidProgress(1.1)).toBe(false);
  });

  it('devrait rejeter NaN', () => {
    expect(isValidProgress(NaN)).toBe(false);
  });

  it('devrait rejeter Infinity', () => {
    expect(isValidProgress(Infinity)).toBe(false);
    expect(isValidProgress(-Infinity)).toBe(false);
  });
});

