import { ProgressUpdateService } from './ProgressUpdateService';
import { setProgress, setLastScrollDirection } from '@/store/scrollSlice';
import { isValidProgress } from '@/utils/validation/isValidProgress';
import type { AppDispatch } from '@/store';

jest.mock('@/utils/validation/isValidProgress');

describe('ProgressUpdateService', () => {
  let dispatch: jest.Mock;
  let service: ProgressUpdateService;

  beforeEach(() => {
    dispatch = jest.fn();
    service = new ProgressUpdateService(dispatch as unknown as AppDispatch);
    (isValidProgress as jest.Mock).mockReturnValue(true);
  });

  describe('updateProgress', () => {
    it('devrait dispatcher setProgress si le progress est valide', () => {
      const result = service.updateProgress(0.5);

      expect(isValidProgress).toHaveBeenCalledWith(0.5);
      expect(dispatch).toHaveBeenCalledWith(setProgress(0.5));
      expect(result).toBe(true);
    });

    it('ne devrait pas dispatcher si le progress est invalide', () => {
      (isValidProgress as jest.Mock).mockReturnValue(false);
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = service.updateProgress(1.5);

      expect(dispatch).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(result).toBe(false);

      consoleWarnSpy.mockRestore();
    });

    it('devrait aussi dispatcher setLastScrollDirection si fourni', () => {
      service.updateProgress(0.5, { scrollDirection: 'forward' });

      expect(dispatch).toHaveBeenCalledWith(setLastScrollDirection('forward'));
      expect(dispatch).toHaveBeenCalledWith({ type: 'scroll/setAutoScrollDirection', payload: 1 });
      expect(dispatch).toHaveBeenCalledWith(setProgress(0.5));
    });

    it('devrait convertir backward en -1 pour autoScrollDirection', () => {
      service.updateProgress(0.5, { scrollDirection: 'backward' });

      expect(dispatch).toHaveBeenCalledWith({ type: 'scroll/setAutoScrollDirection', payload: -1 });
    });

    it('ne devrait pas valider si validate=false', () => {
      service.updateProgress(1.5, { validate: false });

      expect(isValidProgress).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith(setProgress(1.5));
    });
  });

  describe('updateProgressOnly', () => {
    it('devrait mettre à jour uniquement le progress', () => {
      service.updateProgressOnly(0.5);

      expect(dispatch).toHaveBeenCalledWith(setProgress(0.5));
      expect(dispatch).not.toHaveBeenCalledWith(setLastScrollDirection(expect.anything()));
    });
  });

  describe('updateProgressWithDirection', () => {
    it('devrait mettre à jour le progress et la direction', () => {
      service.updateProgressWithDirection(0.5, 'forward');

      expect(dispatch).toHaveBeenCalledWith(setLastScrollDirection('forward'));
      expect(dispatch).toHaveBeenCalledWith(setProgress(0.5));
    });
  });
});

