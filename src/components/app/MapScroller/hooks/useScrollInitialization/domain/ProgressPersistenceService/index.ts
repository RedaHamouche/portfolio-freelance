/**
 * Service de domaine pour la persistance du progress dans le localStorage
 * Gère la sauvegarde et la récupération du progress
 */

const STORAGE_KEY = 'scrollProgress';

export class ProgressPersistenceService {
  /**
   * Sauvegarde le progress dans le localStorage
   * @param progress Progress à sauvegarder (0-1)
   */
  saveProgress(progress: number): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Valider que le progress est dans la plage valide
      if (progress < 0 || progress > 1) {
        console.warn(`[ProgressPersistenceService] Progress invalide: ${progress}, ignoré`);
        return;
      }
      
      localStorage.setItem(STORAGE_KEY, progress.toString());
    } catch (error) {
      // Gérer les erreurs de localStorage (quota dépassé, mode privé, etc.)
      console.warn('[ProgressPersistenceService] Erreur lors de la sauvegarde:', error);
    }
  }

  /**
   * Récupère le progress depuis le localStorage
   * @returns Le progress sauvegardé ou null si absent/invalide
   */
  getProgress(): number | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (!stored) {
        return null;
      }
      
      const progress = parseFloat(stored);
      
      // Valider que le progress est un nombre valide et dans la plage 0-1
      if (isNaN(progress) || progress < 0 || progress > 1) {
        // Nettoyer la valeur invalide
        this.clearProgress();
        return null;
      }
      
      return progress;
    } catch (error) {
      console.warn('[ProgressPersistenceService] Erreur lors de la récupération:', error);
      return null;
    }
  }

  /**
   * Supprime le progress du localStorage
   */
  clearProgress(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[ProgressPersistenceService] Erreur lors de la suppression:', error);
    }
  }

  /**
   * Vérifie si un progress est sauvegardé
   */
  hasProgress(): boolean {
    return this.getProgress() !== null;
  }
}

