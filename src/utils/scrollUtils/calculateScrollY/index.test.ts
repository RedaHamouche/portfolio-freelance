import { calculateScrollY } from './index';
import * as scrollCalculations from '@/utils/scrollCalculations';
import * as viewportCalculations from '@/utils/viewportCalculations';

jest.mock('@/utils/scrollCalculations');
jest.mock('@/utils/viewportCalculations');

describe('calculateScrollY', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (viewportCalculations.getViewportHeight as jest.Mock).mockReturnValue(800);
    (scrollCalculations.calculateFakeScrollHeight as jest.Mock).mockReturnValue(5000);
    (scrollCalculations.calculateMaxScroll as jest.Mock).mockReturnValue(4200);
    (scrollCalculations.calculateScrollYFromProgress as jest.Mock).mockReturnValue(2100);
  });

  it('devrait calculer le scrollY correctement', () => {
    const result = calculateScrollY(0.5, 1000);

    expect(scrollCalculations.calculateFakeScrollHeight).toHaveBeenCalledWith(1000);
    expect(scrollCalculations.calculateMaxScroll).toHaveBeenCalledWith(5000, 800);
    expect(scrollCalculations.calculateScrollYFromProgress).toHaveBeenCalledWith(0.5, 4200);
    expect(result).toBe(2100);
  });
});

