import { syncScrollPosition } from './index';
import { calculateScrollYFromProgress, calculateFakeScrollHeight, calculateMaxScroll } from '@/utils/scrollCalculations';
import { getViewportHeight } from '@/utils/viewportCalculations';

// Mock des utilitaires
jest.mock('@/utils/scrollCalculations', () => ({
  calculateScrollYFromProgress: jest.fn(),
  calculateFakeScrollHeight: jest.fn(),
  calculateMaxScroll: jest.fn(),
}));

jest.mock('@/utils/viewportCalculations', () => ({
  getViewportHeight: jest.fn(),
}));

describe('syncScrollPosition', () => {
  let scrollToSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (getViewportHeight as jest.Mock).mockReturnValue(800);
    (calculateFakeScrollHeight as jest.Mock).mockReturnValue(5000);
    (calculateMaxScroll as jest.Mock).mockReturnValue(4200);
  });

  afterEach(() => {
    scrollToSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('ne devrait pas scroller si la modal est ouverte', () => {
    syncScrollPosition(0.5, 1000, true);

    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it('devrait scroller si la modal n\'est pas ouverte', () => {
    (calculateScrollYFromProgress as jest.Mock).mockReturnValue(2100);

    syncScrollPosition(0.5, 1000, false);

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 2100, behavior: 'auto' });
  });

  it('devrait calculer correctement la position de scroll', () => {
    const newProgress = 0.75;
    const globalPathLength = 2000;
    (calculateScrollYFromProgress as jest.Mock).mockReturnValue(3150);

    syncScrollPosition(newProgress, globalPathLength, false);

    expect(calculateFakeScrollHeight).toHaveBeenCalledWith(globalPathLength);
    expect(getViewportHeight).toHaveBeenCalled();
    expect(calculateMaxScroll).toHaveBeenCalledWith(5000, 800);
    expect(calculateScrollYFromProgress).toHaveBeenCalledWith(newProgress, 4200);
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 3150, behavior: 'auto' });
  });

  it('devrait ignorer le scroll si targetScrollY est NaN', () => {
    (calculateScrollYFromProgress as jest.Mock).mockReturnValue(NaN);

    syncScrollPosition(0.5, 1000, false);

    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('targetScrollY invalide: NaN')
    );
  });

  it('devrait ignorer le scroll si targetScrollY est Infinity', () => {
    (calculateScrollYFromProgress as jest.Mock).mockReturnValue(Infinity);

    syncScrollPosition(0.5, 1000, false);

    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('targetScrollY invalide: Infinity')
    );
  });

  it('devrait ignorer le scroll si targetScrollY est -Infinity', () => {
    (calculateScrollYFromProgress as jest.Mock).mockReturnValue(-Infinity);

    syncScrollPosition(0.5, 1000, false);

    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('targetScrollY invalide: -Infinity')
    );
  });

  it('devrait gérer les erreurs de window.scrollTo()', () => {
    const error = new Error('Scroll error');
    scrollToSpy.mockImplementation(() => {
      throw error;
    });
    (calculateScrollYFromProgress as jest.Mock).mockReturnValue(2100);

    syncScrollPosition(0.5, 1000, false);

    expect(consoleWarnSpy).toHaveBeenCalledWith('[useAutoPlay] Erreur lors du scroll:', error);
  });

  it('devrait accepter progress 0', () => {
    (calculateScrollYFromProgress as jest.Mock).mockReturnValue(0);

    syncScrollPosition(0, 1000, false);

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });

  it('devrait accepter progress 1', () => {
    (calculateScrollYFromProgress as jest.Mock).mockReturnValue(4200);

    syncScrollPosition(1, 1000, false);

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 4200, behavior: 'auto' });
  });
});

