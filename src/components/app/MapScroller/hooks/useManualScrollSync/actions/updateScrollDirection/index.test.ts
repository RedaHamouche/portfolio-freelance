import { updateScrollDirection } from './index';
import { ManualScrollSyncUseCase } from '@/components/app/MapScroller/hooks/useManualScrollSync/application/ManualScrollSyncUseCase';
import { ProgressUpdateService } from '@/components/app/MapScroller/services/ProgressUpdateService';

// Mock ProgressUpdateService
jest.mock('@/components/app/MapScroller/services/ProgressUpdateService');

describe('updateScrollDirection', () => {
  let mockUseCase: jest.Mocked<ManualScrollSyncUseCase>;
  let mockProgressUpdateService: jest.Mocked<ProgressUpdateService>;
  let isAutoPlayingRef: React.MutableRefObject<boolean>;
  let lastScrollDirectionRef: React.MutableRefObject<string | null>;

  beforeEach(() => {
    mockUseCase = {
      getScrollDirection: jest.fn(),
      getCurrentProgress: jest.fn(),
    } as unknown as jest.Mocked<ManualScrollSyncUseCase>;

    mockProgressUpdateService = {
      updateProgressWithDirection: jest.fn(),
    } as unknown as jest.Mocked<ProgressUpdateService>;

    isAutoPlayingRef = { current: false };
    lastScrollDirectionRef = { current: null };
  });

  it('ne devrait rien faire si autoplay est actif', () => {
    isAutoPlayingRef.current = true;

    updateScrollDirection(mockUseCase, mockProgressUpdateService, isAutoPlayingRef, lastScrollDirectionRef);

    expect(mockUseCase.getScrollDirection).not.toHaveBeenCalled();
    expect(mockProgressUpdateService.updateProgressWithDirection).not.toHaveBeenCalled();
  });

  it('ne devrait rien faire si la direction est null', () => {
    mockUseCase.getScrollDirection.mockReturnValue(null);

    updateScrollDirection(mockUseCase, mockProgressUpdateService, isAutoPlayingRef, lastScrollDirectionRef);

    expect(mockProgressUpdateService.updateProgressWithDirection).not.toHaveBeenCalled();
  });

  it('ne devrait rien faire si la direction n\'a pas changé', () => {
    lastScrollDirectionRef.current = 'forward';
    mockUseCase.getScrollDirection.mockReturnValue('forward');

    updateScrollDirection(mockUseCase, mockProgressUpdateService, isAutoPlayingRef, lastScrollDirectionRef);

    expect(mockProgressUpdateService.updateProgressWithDirection).not.toHaveBeenCalled();
  });

  it('devrait mettre à jour la direction si elle a changé', () => {
    lastScrollDirectionRef.current = null;
    mockUseCase.getScrollDirection.mockReturnValue('forward');
    mockUseCase.getCurrentProgress.mockReturnValue(0.5);

    updateScrollDirection(mockUseCase, mockProgressUpdateService, isAutoPlayingRef, lastScrollDirectionRef);

    expect(lastScrollDirectionRef.current).toBe('forward');
    expect(mockProgressUpdateService.updateProgressWithDirection).toHaveBeenCalledWith(0.5, 'forward');
  });

  it('devrait mettre à jour la direction de backward à forward', () => {
    lastScrollDirectionRef.current = 'backward';
    mockUseCase.getScrollDirection.mockReturnValue('forward');
    mockUseCase.getCurrentProgress.mockReturnValue(0.7);

    updateScrollDirection(mockUseCase, mockProgressUpdateService, isAutoPlayingRef, lastScrollDirectionRef);

    expect(lastScrollDirectionRef.current).toBe('forward');
    expect(mockProgressUpdateService.updateProgressWithDirection).toHaveBeenCalledWith(0.7, 'forward');
  });

  it('devrait mettre à jour la direction de forward à backward', () => {
    lastScrollDirectionRef.current = 'forward';
    mockUseCase.getScrollDirection.mockReturnValue('backward');
    mockUseCase.getCurrentProgress.mockReturnValue(0.3);

    updateScrollDirection(mockUseCase, mockProgressUpdateService, isAutoPlayingRef, lastScrollDirectionRef);

    expect(lastScrollDirectionRef.current).toBe('backward');
    expect(mockProgressUpdateService.updateProgressWithDirection).toHaveBeenCalledWith(0.3, 'backward');
  });
});

