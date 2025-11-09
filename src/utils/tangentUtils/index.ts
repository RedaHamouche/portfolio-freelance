/**
 * Utilitaires pour les calculs de tangente et de positionnement de texte
 * Fonctions communes utilisées par TextOnPath, TextOnCircle, et DynamicPathTangenteComponents
 */

/**
 * Normalise un angle pour que le texte soit toujours lisible (jamais à l'envers)
 * Utilisé pour les composants qui affichent du texte le long d'un path ou d'un cercle
 */
export function normalizeAngleForReadability(angle: number): number {
  let normalizedAngle = ((angle % 360) + 360) % 360;
  if (normalizedAngle > 180) {
    normalizedAngle -= 360;
  }
  
  const wasFlipped = normalizedAngle > 90 || normalizedAngle < -90;
  
  if (wasFlipped) {
    normalizedAngle += 180;
    normalizedAngle = ((normalizedAngle % 360) + 360) % 360;
    if (normalizedAngle > 180) {
      normalizedAngle -= 360;
    }
  }
  
  return normalizedAngle;
}

/**
 * Calcule la position perpendiculaire à un point sur le path
 * Choisit automatiquement la perpendiculaire qui pointe vers le bas (y positif)
 * pour garantir que le texte soit toujours en dessous du path
 * 
 * Optimisé: calculs en une seule passe, évite les recalculs
 */
export function getPerpendicularOffset(
  point: { x: number; y: number },
  angle: number,
  offset: number
): { x: number; y: number } {
  // Convertir en radians une seule fois
  const angleRad = (angle * Math.PI) / 180;
  
  // Pré-calculer sin et cos pour éviter les recalculs
  const sinAngle = Math.sin(angleRad);
  const cosAngle = Math.cos(angleRad);
  
  // Calculer les deux perpendiculaires possibles
  // Perp1: (-sin θ, cos θ)
  // Perp2: (sin θ, -cos θ)
  const perp1Y = cosAngle;
  const perp2Y = -cosAngle;
  
  // Choisir la perpendiculaire qui pointe vers le bas (y positif)
  // Si les deux ont le même y, choisir celle qui pointe vers la droite (x positif)
  let perpX: number;
  let perpY: number;
  
  if (perp1Y > perp2Y) {
    perpX = -sinAngle;
    perpY = perp1Y;
  } else if (perp2Y > perp1Y) {
    perpX = sinAngle;
    perpY = perp2Y;
  } else {
    // Égalité: choisir celle qui pointe vers la droite
    const perp1X = -sinAngle;
    const perp2X = sinAngle;
    if (perp1X > perp2X) {
      perpX = perp1X;
      perpY = perp1Y;
    } else {
      perpX = perp2X;
      perpY = perp2Y;
    }
  }
  
  return {
    x: point.x + perpX * offset,
    y: point.y + perpY * offset,
  };
}

/**
 * Calcule la position d'un point sur un cercle
 * Optimisé: calcul direct sans boucle
 */
export function getPointOnCircle(
  centerX: number,
  centerY: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY + radius * Math.sin(angleRad),
  };
}

