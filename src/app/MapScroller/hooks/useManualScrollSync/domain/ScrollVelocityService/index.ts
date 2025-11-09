/**
 * Service de domaine pour gérer la vélocité du scroll
 * Calcule et maintient la vélocité du scroll pour simuler une inertie naturelle
 * avec friction progressive (loi de Fitts)
 */
export class ScrollVelocityService {
  private velocity: number = 0;
  private lastScrollY: number = 0;
  private lastTime: number = 0;
  private readonly friction: number; // Coefficient de friction (décroissance de la vélocité)
  private readonly maxVelocity: number; // Vélocité maximale pour éviter les valeurs extrêmes

  constructor(friction: number = 0.92, maxVelocity: number = 0.1) {
    this.friction = friction;
    this.maxVelocity = maxVelocity;
  }

  /**
   * Met à jour la vélocité basée sur le changement de scrollY
   * @param scrollY Position actuelle du scroll
   * @param currentTime Temps actuel (performance.now())
   */
  updateVelocity(scrollY: number, currentTime: number): void {
    if (this.lastTime === 0) {
      // Première mise à jour, initialiser
      this.lastScrollY = scrollY;
      this.lastTime = currentTime;
      this.velocity = 0;
      return;
    }

    const deltaTime = currentTime - this.lastTime;
    if (deltaTime <= 0) return; // Éviter division par zéro

    const deltaScroll = scrollY - this.lastScrollY;
    const instantVelocity = deltaScroll / deltaTime; // pixels par milliseconde

    // Calculer la vélocité moyenne avec pondération exponentielle
    // Plus le deltaTime est petit, plus on donne de poids à la vélocité instantanée
    const alpha = Math.min(deltaTime / 100, 1); // Normaliser sur 100ms
    this.velocity = this.velocity * (1 - alpha) + instantVelocity * alpha;

    // Limiter la vélocité maximale pour éviter les valeurs extrêmes
    this.velocity = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, this.velocity));

    this.lastScrollY = scrollY;
    this.lastTime = currentTime;
  }

  /**
   * Met à jour la vélocité directement depuis un événement wheel
   * Utile pour capturer la vélocité immédiate du scroll
   */
  updateVelocityFromWheel(deltaY: number, currentTime: number): void {
    // Convertir deltaY en vélocité approximative
    // deltaY est en pixels, on le normalise pour obtenir une vélocité relative
    const normalizedVelocity = deltaY / 1000; // Normaliser sur 1000px
    
    // Appliquer une pondération avec la vélocité existante
    const alpha = 0.7; // 70% de la nouvelle vélocité, 30% de l'ancienne
    this.velocity = this.velocity * (1 - alpha) + normalizedVelocity * alpha;

    // Limiter la vélocité maximale
    this.velocity = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, this.velocity));

    this.lastTime = currentTime;
  }

  /**
   * Applique la friction à la vélocité (décroissance progressive)
   * Retourne la vélocité après friction
   */
  applyFriction(): number {
    this.velocity *= this.friction;
    return this.velocity;
  }

  /**
   * Récupère la vélocité actuelle
   */
  getVelocity(): number {
    return this.velocity;
  }

  /**
   * Récupère la vélocité absolue (magnitude)
   */
  getAbsoluteVelocity(): number {
    return Math.abs(this.velocity);
  }

  /**
   * Réinitialise la vélocité
   */
  reset(): void {
    this.velocity = 0;
    this.lastScrollY = 0;
    this.lastTime = 0;
  }

  /**
   * Vérifie si la vélocité est significative (au-dessus d'un seuil)
   */
  isSignificant(threshold: number = 0.001): boolean {
    return Math.abs(this.velocity) > threshold;
  }
}

