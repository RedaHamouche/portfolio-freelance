/**
 * Vérifie si on peut faire une pause sur un anchor (cooldown de 5 secondes)
 */
export function canPauseOnAnchor(
  anchorId: string | undefined,
  lastPausedTimeRef: React.MutableRefObject<Map<string, number>>
): boolean {
  if (!anchorId) return false;
  const lastPausedTime = lastPausedTimeRef.current.get(anchorId);
  if (!lastPausedTime) return true; // Jamais pausé sur cet anchor
  const timeSinceLastPause = performance.now() - lastPausedTime;
  return timeSinceLastPause >= 5000; // 5 secondes
}

