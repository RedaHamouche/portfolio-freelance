import type { AppDispatch } from '@/store';
import { setProgress, setLastScrollDirection } from '@/store/scrollSlice';
import { isValidProgress } from '@/utils/validation/isValidProgress';

export type ScrollDirection = 'forward' | 'backward' | null;

export interface UpdateProgressOptions {
  scrollDirection?: ScrollDirection;
  validate?: boolean;
}

/**
 * Service pour mettre à jour le progress dans Redux
 * Source unique de vérité pour dispatch(setProgress())
 * 
 * Valide le progress avant de le dispatcher
 * Peut aussi mettre à jour la direction du scroll
 */
export class ProgressUpdateService {
  constructor(private dispatch: AppDispatch) {}

  /**
   * Met à jour le progress dans Redux
   * Valide le progress avant de le dispatcher
   * 
   * @param progress - Le progress à mettre à jour (0-1)
   * @param options - Options supplémentaires (scrollDirection, validate)
   * @returns true si le progress a été mis à jour, false si invalide
   */
  updateProgress(progress: number, options: UpdateProgressOptions = {}): boolean {
    const { scrollDirection, validate = true } = options;

    // Valider le progress si demandé
    if (validate && !isValidProgress(progress)) {
      console.warn(`[ProgressUpdateService] Progress invalide: ${progress}, ignoré`);
      return false;
    }

    // Mettre à jour la direction si fournie
    if (scrollDirection !== undefined && scrollDirection !== null) {
      this.dispatch(setLastScrollDirection(scrollDirection));
      
      // Convertir la direction en autoScrollDirection si nécessaire
      const autoScrollDirection = scrollDirection === 'forward' ? 1 : -1;
      this.dispatch({ type: 'scroll/setAutoScrollDirection', payload: autoScrollDirection });
    }

    // Mettre à jour le progress
    this.dispatch(setProgress(progress));
    return true;
  }

  /**
   * Met à jour uniquement le progress (sans direction)
   * 
   * @param progress - Le progress à mettre à jour (0-1)
   * @returns true si le progress a été mis à jour, false si invalide
   */
  updateProgressOnly(progress: number): boolean {
    return this.updateProgress(progress, { validate: true });
  }

  /**
   * Met à jour le progress et la direction
   * 
   * @param progress - Le progress à mettre à jour (0-1)
   * @param scrollDirection - La direction du scroll
   * @returns true si le progress a été mis à jour, false si invalide
   */
  updateProgressWithDirection(progress: number, scrollDirection: ScrollDirection): boolean {
    return this.updateProgress(progress, { scrollDirection, validate: true });
  }
}

