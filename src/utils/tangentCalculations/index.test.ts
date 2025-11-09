/**
 * Tests pour les calculs de tangente sur les paths SVG
 * Vérifie que les calculs fonctionnent correctement pour mobile et desktop
 */

import { getPathAngleAtProgress, getPointOnPath, calculateAdaptiveDelta } from '../pathCalculations';
import { globalPathPositionCache } from '../pathPositionCache';

// Nettoyer le cache avant chaque test pour éviter les interférences
beforeEach(() => {
  globalPathPositionCache.clear();
});

/**
 * Crée un mock SVGPathElement pour un path horizontal (pour tester les angles simples)
 */
function createHorizontalPath(totalLength: number): SVGPathElement {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
  path.setAttribute('d', `M0,0 L${totalLength},0`);
  
  Object.defineProperty(path, 'getTotalLength', {
    value: jest.fn(() => totalLength),
    writable: true,
    configurable: true,
  });
  
  Object.defineProperty(path, 'getPointAtLength', {
    value: jest.fn((length: number) => {
      // Path horizontal: x varie, y reste à 0
      return { x: length, y: 0 };
    }),
    writable: true,
    configurable: true,
  });
  
  return path;
}

/**
 * Crée un mock SVGPathElement pour un path vertical
 */
function createVerticalPath(totalLength: number): SVGPathElement {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
  path.setAttribute('d', `M0,0 L0,${totalLength}`);
  
  Object.defineProperty(path, 'getTotalLength', {
    value: jest.fn(() => totalLength),
    writable: true,
    configurable: true,
  });
  
  Object.defineProperty(path, 'getPointAtLength', {
    value: jest.fn((length: number) => {
      // Path vertical: x reste à 0, y varie
      return { x: 0, y: length };
    }),
    writable: true,
    configurable: true,
  });
  
  return path;
}

/**
 * Crée un mock SVGPathElement pour un path diagonal
 */
function createDiagonalPath(totalLength: number): SVGPathElement {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
  // Path diagonal à 45 degrés: même distance en x et y
  const side = Math.sqrt(totalLength * totalLength / 2);
  path.setAttribute('d', `M0,0 L${side},${side}`);
  
  Object.defineProperty(path, 'getTotalLength', {
    value: jest.fn(() => totalLength),
    writable: true,
    configurable: true,
  });
  
  Object.defineProperty(path, 'getPointAtLength', {
    value: jest.fn((length: number) => {
      // Path diagonal à 45°: x = y = length / sqrt(2)
      const coord = length / Math.sqrt(2);
      return { x: coord, y: coord };
    }),
    writable: true,
    configurable: true,
  });
  
  return path;
}

/**
 * Crée un mock SVGPathElement pour un path circulaire
 * @param radius Rayon du cercle
 * @param centerX Centre X du cercle (défaut: radius)
 * @param centerY Centre Y du cercle (défaut: radius)
 */
function createCircularPath(radius: number, centerX: number = radius, centerY: number = radius): SVGPathElement {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
  // Path circulaire: cercle complet
  // La circonférence d'un cercle est 2 * π * radius
  const circumference = 2 * Math.PI * radius;
  path.setAttribute('d', `M ${centerX},${centerY - radius} A ${radius},${radius} 0 1,1 ${centerX},${centerY + radius} A ${radius},${radius} 0 1,1 ${centerX},${centerY - radius}`);
  
  Object.defineProperty(path, 'getTotalLength', {
    value: jest.fn(() => circumference),
    writable: true,
    configurable: true,
  });
  
  Object.defineProperty(path, 'getPointAtLength', {
    value: jest.fn((length: number) => {
      // Pour un cercle, on calcule l'angle à partir de la longueur
      // angle en radians = (length / circumference) * 2π
      // On commence en haut du cercle (angle = -90° ou 270°)
      const angleRad = (length / circumference) * 2 * Math.PI - Math.PI / 2;
      return {
        x: centerX + radius * Math.cos(angleRad),
        y: centerY + radius * Math.sin(angleRad),
      };
    }),
    writable: true,
    configurable: true,
  });
  
  return path;
}

describe('Tangent Calculations - getPathAngleAtProgress', () => {
  describe('Path horizontal (angle attendu: ~0°)', () => {
    it('devrait calculer un angle proche de 0° pour un path horizontal (desktop)', () => {
      const pathLength = 5000; // Desktop: path plus long
      const path = createHorizontalPath(pathLength);
      
      const angle = getPathAngleAtProgress(path, 0.5, 10, pathLength);
      
      // L'angle devrait être proche de 0° (horizontal vers la droite)
      expect(Math.abs(angle)).toBeLessThan(5); // Tolérance de 5°
    });

    it('devrait calculer un angle proche de 0° pour un path horizontal (mobile)', () => {
      const pathLength = 3000; // Mobile: path plus court
      const path = createHorizontalPath(pathLength);
      
      const angle = getPathAngleAtProgress(path, 0.5, 5, pathLength);
      
      // L'angle devrait être proche de 0°
      expect(Math.abs(angle)).toBeLessThan(5);
    });

    it('devrait utiliser un delta adaptatif pour mobile', () => {
      const pathLength = 3000;
      const path = createHorizontalPath(pathLength);
      
      // Delta adaptatif: 0.1% de la longueur, min 2px
      const adaptiveDelta = Math.max(2, pathLength * 0.001);
      expect(adaptiveDelta).toBe(3); // 3000 * 0.001 = 3
      
      const angle = getPathAngleAtProgress(path, 0.5, adaptiveDelta, pathLength);
      expect(Math.abs(angle)).toBeLessThan(5);
    });

    it('devrait utiliser un delta adaptatif pour desktop', () => {
      const pathLength = 8000;
      const path = createHorizontalPath(pathLength);
      
      // Delta adaptatif: 0.1% de la longueur, min 2px
      const adaptiveDelta = Math.max(2, pathLength * 0.001);
      expect(adaptiveDelta).toBe(8); // 8000 * 0.001 = 8
      
      const angle = getPathAngleAtProgress(path, 0.5, adaptiveDelta, pathLength);
      expect(Math.abs(angle)).toBeLessThan(5);
    });
  });

  describe('Path vertical (angle attendu: ~90°)', () => {
    it('devrait calculer un angle proche de 90° pour un path vertical (desktop)', () => {
      const pathLength = 5000;
      const path = createVerticalPath(pathLength);
      
      const angle = getPathAngleAtProgress(path, 0.5, 10, pathLength);
      
      // L'angle devrait être proche de 90° (vertical vers le bas)
      expect(Math.abs(angle - 90)).toBeLessThan(5);
    });

    it('devrait calculer un angle proche de 90° pour un path vertical (mobile)', () => {
      const pathLength = 3000;
      const path = createVerticalPath(pathLength);
      
      const adaptiveDelta = Math.max(2, pathLength * 0.001);
      const angle = getPathAngleAtProgress(path, 0.5, adaptiveDelta, pathLength);
      
      expect(Math.abs(angle - 90)).toBeLessThan(5);
    });
  });

  describe('Path diagonal (angle attendu: ~45°)', () => {
    it('devrait calculer un angle proche de 45° pour un path diagonal', () => {
      const pathLength = 5000;
      const path = createDiagonalPath(pathLength);
      
      const adaptiveDelta = Math.max(2, pathLength * 0.001);
      const angle = getPathAngleAtProgress(path, 0.5, adaptiveDelta, pathLength);
      
      // L'angle devrait être proche de 45°
      expect(Math.abs(angle - 45)).toBeLessThan(5);
    });
  });

  describe('Path circulaire', () => {
    it('devrait calculer correctement l\'angle tangent pour un path circulaire (desktop)', () => {
      const radius = 1000; // Rayon du cercle
      const path = createCircularPath(radius);
      const pathLength = 2 * Math.PI * radius; // Circonférence
      
      // À progress = 0 (début du cercle, en haut), l'angle devrait être ~0° (vers la droite)
      const angle0 = getPathAngleAtProgress(path, 0, undefined, pathLength);
      expect(Math.abs(angle0)).toBeLessThan(10); // Tolérance de 10° pour le début du cercle
      
      // À progress = 0.25 (quart du cercle, à droite), l'angle devrait être ~90° (vers le bas)
      const angle025 = getPathAngleAtProgress(path, 0.25, undefined, pathLength);
      expect(Math.abs(angle025 - 90)).toBeLessThan(10);
      
      // À progress = 0.5 (milieu du cercle, en bas), l'angle devrait être ~180° ou ~0° (vers la gauche ou droite)
      const angle05 = getPathAngleAtProgress(path, 0.5, undefined, pathLength);
      expect(typeof angle05).toBe('number');
      expect(isNaN(angle05)).toBe(false);
      
      // À progress = 0.75 (trois quarts du cercle, à gauche), l'angle devrait être ~270° ou ~-90° (vers le haut)
      const angle075 = getPathAngleAtProgress(path, 0.75, undefined, pathLength);
      expect(typeof angle075).toBe('number');
      expect(isNaN(angle075)).toBe(false);
    });

    it('devrait calculer correctement l\'angle tangent pour un path circulaire (mobile)', () => {
      const radius = 500; // Rayon plus petit pour mobile
      const path = createCircularPath(radius);
      const pathLength = 2 * Math.PI * radius;
      
      const adaptiveDelta = calculateAdaptiveDelta(pathLength);
      const angle = getPathAngleAtProgress(path, 0.25, adaptiveDelta, pathLength);
      
      // À 25% du cercle, l'angle devrait être proche de 90° (vers le bas)
      expect(Math.abs(angle - 90)).toBeLessThan(10);
    });

    it('devrait donner des angles cohérents autour du cercle complet', () => {
      const radius = 1000;
      const path = createCircularPath(radius);
      const pathLength = 2 * Math.PI * radius;
      
      const adaptiveDelta = calculateAdaptiveDelta(pathLength);
      
      // Tester plusieurs points autour du cercle
      const progressPoints = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];
      const angles = progressPoints.map(progress => 
        getPathAngleAtProgress(path, progress, adaptiveDelta, pathLength)
      );
      
      // Tous les angles devraient être des nombres valides
      angles.forEach(angle => {
        expect(typeof angle).toBe('number');
        expect(isNaN(angle)).toBe(false);
        expect(isFinite(angle)).toBe(true);
      });
      
      // Les angles devraient varier de manière continue autour du cercle
      // (pas de sauts brusques, sauf les transitions de -180° à +180°)
      for (let i = 1; i < angles.length; i++) {
        const prevAngle = angles[i - 1];
        const currAngle = angles[i];
        
        // Normaliser les angles pour calculer la différence minimale
        // (gérer les transitions de -180° à +180°)
        let diff = Math.abs(currAngle - prevAngle);
        
        // Si la différence est > 180°, c'est peut-être un saut de -180° à +180°
        // On calcule la différence minimale dans les deux sens
        if (diff > 180) {
          const altDiff1 = Math.abs((currAngle - 360) - prevAngle);
          const altDiff2 = Math.abs(currAngle - (prevAngle - 360));
          diff = Math.min(diff, altDiff1, altDiff2);
        }
        
        // La différence ne devrait pas être trop grande (max 100° pour un cercle)
        // On tolère jusqu'à 100° car on teste tous les 12.5% du cercle (45°)
        expect(diff).toBeLessThan(100);
      }
    });

    it('devrait utiliser un delta adaptatif pour un path circulaire', () => {
      const radius = 1000;
      const path = createCircularPath(radius);
      const pathLength = 2 * Math.PI * radius;
      
      const adaptiveDelta = calculateAdaptiveDelta(pathLength);
      
      // Le delta devrait être adapté à la longueur du cercle
      expect(adaptiveDelta).toBeGreaterThanOrEqual(2);
      expect(adaptiveDelta).toBeLessThanOrEqual(pathLength * 0.01); // Max 1% de la longueur
      
      const angle = getPathAngleAtProgress(path, 0.5, adaptiveDelta, pathLength);
      expect(typeof angle).toBe('number');
      expect(isNaN(angle)).toBe(false);
    });
  });

  describe('Cas limites', () => {
    it('devrait gérer progress = 0', () => {
      const pathLength = 3000;
      const path = createHorizontalPath(pathLength);
      
      const adaptiveDelta = Math.max(2, pathLength * 0.001);
      const angle = getPathAngleAtProgress(path, 0, adaptiveDelta, pathLength);
      
      expect(typeof angle).toBe('number');
      expect(isNaN(angle)).toBe(false);
    });

    it('devrait gérer progress = 1', () => {
      const pathLength = 3000;
      const path = createHorizontalPath(pathLength);
      
      const adaptiveDelta = Math.max(2, pathLength * 0.001);
      const angle = getPathAngleAtProgress(path, 1, adaptiveDelta, pathLength);
      
      expect(typeof angle).toBe('number');
      expect(isNaN(angle)).toBe(false);
    });

    it('devrait gérer un delta très petit', () => {
      const pathLength = 3000;
      const path = createHorizontalPath(pathLength);
      
      // Delta très petit (1px)
      const angle = getPathAngleAtProgress(path, 0.5, 1, pathLength);
      
      expect(typeof angle).toBe('number');
      expect(isNaN(angle)).toBe(false);
    });

    it('devrait gérer un delta très grand', () => {
      const pathLength = 3000;
      const path = createHorizontalPath(pathLength);
      
      // Delta très grand (10% de la longueur)
      const angle = getPathAngleAtProgress(path, 0.5, pathLength * 0.1, pathLength);
      
      expect(typeof angle).toBe('number');
      expect(isNaN(angle)).toBe(false);
    });
  });

  describe('Comparaison mobile vs desktop', () => {
    it('devrait donner des résultats cohérents entre mobile et desktop pour le même path', () => {
      const mobileLength = 3000;
      const desktopLength = 8000;
      
      const mobilePath = createHorizontalPath(mobileLength);
      const desktopPath = createHorizontalPath(desktopLength);
      
      const mobileDelta = Math.max(2, mobileLength * 0.001);
      const desktopDelta = Math.max(2, desktopLength * 0.001);
      
      const mobileAngle = getPathAngleAtProgress(mobilePath, 0.5, mobileDelta, mobileLength);
      const desktopAngle = getPathAngleAtProgress(desktopPath, 0.5, desktopDelta, desktopLength);
      
      // Les angles devraient être similaires (proche de 0°)
      expect(Math.abs(mobileAngle)).toBeLessThan(5);
      expect(Math.abs(desktopAngle)).toBeLessThan(5);
      // Les angles devraient être très proches l'un de l'autre
      expect(Math.abs(mobileAngle - desktopAngle)).toBeLessThan(1);
    });
  });
});

describe('Tangent Calculations - getPointOnPath', () => {
  it('devrait retourner le point au début du path (progress = 0)', () => {
    const pathLength = 3000;
    const path = createHorizontalPath(pathLength);
    
    const point = getPointOnPath(path, 0, pathLength);
    
    expect(point.x).toBe(0);
    expect(point.y).toBe(0);
  });

  it('devrait retourner le point à la fin du path (progress = 1)', () => {
    const pathLength = 3000;
    const path = createHorizontalPath(pathLength);
    
    const point = getPointOnPath(path, 1, pathLength);
    
    // Pour un path horizontal M0,0 L3000,0, à progress=1, on est à x=3000, y=0
    expect(point.x).toBe(pathLength);
    expect(point.y).toBe(0);
  });

  it('devrait retourner le point au milieu du path (progress = 0.5)', () => {
    const pathLength = 3000;
    const path = createHorizontalPath(pathLength);
    
    const point = getPointOnPath(path, 0.5, pathLength);
    
    // Au milieu: x = 1500, y = 0
    expect(point.x).toBe(pathLength / 2);
    expect(point.y).toBe(0);
  });

  it('devrait fonctionner avec mobile et desktop', () => {
    const mobileLength = 3000;
    const desktopLength = 8000;
    
    const mobilePath = createHorizontalPath(mobileLength);
    const desktopPath = createHorizontalPath(desktopLength);
    
    const mobilePoint = getPointOnPath(mobilePath, 0.5, mobileLength);
    const desktopPoint = getPointOnPath(desktopPath, 0.5, desktopLength);
    
    // Les points devraient être proportionnels à leur longueur respective
    expect(mobilePoint.x).toBe(mobileLength / 2);
    expect(desktopPoint.x).toBe(desktopLength / 2);
  });
});

describe('Tangent Calculations - calculateAdaptiveDelta', () => {
  it('devrait calculer un delta adaptatif pour mobile (path court)', () => {
    const pathLength = 3000;
    const delta = calculateAdaptiveDelta(pathLength);
    
    // 0.1% de 3000 = 3, minimum 2, donc 3
    expect(delta).toBe(3);
  });

  it('devrait calculer un delta adaptatif pour desktop (path long)', () => {
    const pathLength = 8000;
    const delta = calculateAdaptiveDelta(pathLength);
    
    // 0.1% de 8000 = 8, minimum 2, donc 8
    expect(delta).toBe(8);
  });

  it('devrait respecter le minimum pour un path très court', () => {
    const pathLength = 100; // Path très court
    const delta = calculateAdaptiveDelta(pathLength);
    
    // 0.1% de 100 = 0.1, mais minimum 2, donc 2
    expect(delta).toBe(2);
  });

  it('devrait permettre de personnaliser le minimum et le pourcentage', () => {
    const pathLength = 5000;
    const delta = calculateAdaptiveDelta(pathLength, 5, 0.002); // Min 5, 0.2%
    
    // 0.2% de 5000 = 10, minimum 5, donc 10
    expect(delta).toBe(10);
  });
});

