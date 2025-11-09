/**
 * Service de domaine pour calculer le zoom dynamique selon l'état du scroll
 */
export class ZoomService {
  private readonly zoomOutFactor: number;

  /**
   * @param zoomOutFactor Facteur de dézoom pendant le scroll (0-1). Ex: 0.1 = 10% de dézoom
   */
  constructor(zoomOutFactor: number = 0.1) {
    if (zoomOutFactor < 0 || zoomOutFactor >= 1) {
      throw new Error('zoomOutFactor doit être entre 0 et 1 (exclus)');
    }
    this.zoomOutFactor = zoomOutFactor;
  }

  /**
   * Calcule le zoom selon l'état du scroll
   * @param baseScale Scale de base (zoom normal)
   * @param isScrolling Si true, applique le dézoom, sinon retourne le scale de base
   * @returns Le scale calculé
   */
  calculateZoom(baseScale: number, isScrolling: boolean): number {
    if (!isScrolling) {
      return baseScale;
    }

    const zoomedScale = baseScale * (1 - this.zoomOutFactor);
    // S'assurer que le scale ne devient jamais négatif ou zéro
    return Math.max(0.01, zoomedScale);
  }

  /**
   * Retourne le facteur de dézoom configuré
   */
  getZoomOutFactor(): number {
    return this.zoomOutFactor;
  }
}

