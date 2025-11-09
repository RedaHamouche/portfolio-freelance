import { isValidScrollY } from './index';

describe('isValidScrollY', () => {
  it('devrait valider les nombres finis', () => {
    expect(isValidScrollY(0)).toBe(true);
    expect(isValidScrollY(100)).toBe(true);
    expect(isValidScrollY(-50)).toBe(true);
  });

  it('devrait rejeter NaN', () => {
    expect(isValidScrollY(NaN)).toBe(false);
  });

  it('devrait rejeter Infinity', () => {
    expect(isValidScrollY(Infinity)).toBe(false);
    expect(isValidScrollY(-Infinity)).toBe(false);
  });
});

