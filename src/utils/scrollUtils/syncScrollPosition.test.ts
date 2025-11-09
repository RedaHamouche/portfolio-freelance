import { syncScrollPosition } from './syncScrollPosition';
import { calculateScrollY } from './calculateScrollY';
import { isValidScrollY } from '../validation/isValidScrollY';

jest.mock('./calculateScrollY');
jest.mock('../validation/isValidScrollY');

describe('syncScrollPosition', () => {
  const mockScrollTo = jest.fn();
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollTo = mockScrollTo;
    (isValidScrollY as jest.Mock).mockReturnValue(true);
    (calculateScrollY as jest.Mock).mockReturnValue(2100);
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
  });

  it('devrait scroller si tout est valide', () => {
    const result = syncScrollPosition(0.5, 1000, false);

    expect(calculateScrollY).toHaveBeenCalledWith(0.5, 1000);
    expect(isValidScrollY).toHaveBeenCalledWith(2100);
    expect(mockScrollTo).toHaveBeenCalledWith({ top: 2100, behavior: 'auto' });
    expect(result).toBe(true);
  });

  it('ne devrait pas scroller si la modal est ouverte', () => {
    const result = syncScrollPosition(0.5, 1000, true);

    expect(mockScrollTo).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('ne devrait pas scroller si scrollY est invalide', () => {
    (isValidScrollY as jest.Mock).mockReturnValue(false);
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = syncScrollPosition(0.5, 1000, false);

    expect(mockScrollTo).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(result).toBe(false);

    consoleWarnSpy.mockRestore();
  });

  it('devrait gérer les erreurs de window.scrollTo()', () => {
    mockScrollTo.mockImplementation(() => {
      throw new Error('Scroll failed');
    });
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = syncScrollPosition(0.5, 1000, false);

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(result).toBe(false);

    consoleWarnSpy.mockRestore();
  });

  it('devrait utiliser le behavior personnalisé', () => {
    syncScrollPosition(0.5, 1000, false, { behavior: 'instant' });

    expect(mockScrollTo).toHaveBeenCalledWith({ top: 2100, behavior: 'instant' });
  });
});

