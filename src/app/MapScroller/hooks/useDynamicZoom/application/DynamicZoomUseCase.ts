import { ZoomService } from '../domain/ZoomService';

/**
 * Use case pour gérer le zoom dynamique selon l'état du scroll
 */
export class DynamicZoomUseCase {
  private readonly zoomService: ZoomService;
  private isScrollingState: boolean = false;

  constructor(zoomService: ZoomService) {
    this.zoomService = zoomService;
  }

  /**
   * Met à jour l'état du scroll
   * @param isScrolling True si l'utilisateur est en train de scroller
   */
  updateScrollState(isScrolling: boolean): void {
    this.isScrollingState = isScrolling;
  }

  /**
   * Retourne le zoom actuel selon l'état du scroll
   * @param baseScale Scale de base (zoom normal)
   * @returns Le scale calculé selon l'état du scroll
   */
  getCurrentZoom(baseScale: number): number {
    return this.zoomService.calculateZoom(baseScale, this.isScrollingState);
  }

  /**
   * Retourne l'état actuel du scroll
   */
  isScrolling(): boolean {
    return this.isScrollingState;
  }
}

