# Analyse des Optimisations de Performance

## 🔴 CRITIQUES - À Optimiser Urgemment

### 1. **useDynamicZoom** - Zoom Dynamique

**Fichier**: `src/app/MapScroller/hooks/useDynamicZoom/index.ts`

- **Problème**: Animation GSAP à chaque changement de `isScrolling`
- **Impact**: Recalculs de `viewportConfig` → recalculs de `viewportBounds` → re-render de `MapViewport`
- **Fréquence**: À chaque changement d'état de scroll
- **Recommandation**: Désactiver par défaut si pas essentiel (`DYNAMIC_ZOOM_CONFIG.default.enabled = false`)

### 2. **Double RAF dans handleUserInteraction**

**Fichier**: `src/app/MapScroller/hooks/useManualScrollSync/index.ts:361-366`

```typescript
rafIdRef.current = requestAnimationFrame(() => {
  scrollYRef.current = window.scrollY;
  requestAnimationFrame(() => {
    scrollYRef.current = window.scrollY;
    processScrollUpdate();
  });
});
```

- **Problème**: Double RAF inutile, `scrollYRef.current` mis à jour deux fois
- **Impact**: Délai supplémentaire d'une frame
- **Recommandation**: Supprimer le double RAF, garder un seul

### 3. **checkScrollEnd avec RAF continu**

**Fichier**: `src/app/MapScroller/hooks/useManualScrollSync/index.ts:344-354`

- **Problème**: RAF qui tourne en continu pour détecter l'arrêt du scroll
- **Impact**: Calculs inutiles même quand le scroll est arrêté
- **Recommandation**: Remplacer par un `setTimeout` avec `SCROLL_CONFIG.SCROLL_END_DELAY`

### 4. **Calculs de direction à chaque frame**

**Fichier**: `src/app/MapScroller/hooks/useManualScrollSync/index.ts:184-191, 248-256`

- **Problème**: `getScrollDirection()` appelé à chaque frame dans `easingLoop` et `processScrollUpdate`
- **Impact**: Calculs inutiles si la direction n'a pas changé
- **Recommandation**: Cacher la direction avec un ref et ne recalculer que si nécessaire

### 5. **updateVelocity même si désactivé**

**Fichier**: `src/app/MapScroller/hooks/useManualScrollSync/index.ts:237, 324, 405`

- **Problème**: `updateVelocity()` appelé même si `SCROLL_VELOCITY_CONFIG.enabled = false`
- **Impact**: Calculs inutiles
- **Recommandation**: Ajouter une condition `if (velocityConfig.enabled)` avant chaque appel

## 🟡 MOYENS - À Optimiser

### 6. **DynamicPathComponents - Calcul de toutes les positions**

**Fichier**: `src/templating/components/DynamicPathComponents.tsx:195-200`

- **Problème**: Toutes les positions recalculées à chaque changement de `progress`
- **Impact**: Si 50 composants, 50 appels à `getPointOnPath` à chaque frame
- **Recommandation**: Lazy loading ou calculer seulement les composants visibles

### 7. **DynamicPathTangenteComponents - Calcul de toutes les positions**

**Fichier**: `src/templating/components/DynamicPathTangenteComponents.tsx:44-81`

- **Problème**: Toutes les positions et angles recalculés à chaque changement de `progress`
- **Impact**: Si 10 composants tangente, 10 appels à `getPointOnPath` + 10 appels à `getPathAngleAtProgress`
- **Recommandation**: Lazy loading ou calculer seulement les composants visibles

### 8. **PieceOfArt - Animation GSAP à chaque progress**

**Fichier**: `src/components/PieceOfArt/index.tsx:91-118`

- **Problème**: Animation GSAP créée/détruite à chaque changement de `progress`
- **Impact**: Si plusieurs `PieceOfArt`, plusieurs animations GSAP simultanées
- **Recommandation**: Throttle les animations ou utiliser `gsap.quickTo` au lieu de `gsap.to`

### 9. **useProgressAnimation - Calculs à chaque progress**

**Fichier**: `src/hooks/useProgressAnimation/index.ts:91-119, 138-151`

- **Problème**: Calculs d'animation et updates complexes à chaque changement de `progress`
- **Impact**: Si plusieurs composants utilisent ce hook, calculs multipliés
- **Recommandation**: Throttle ou debounce les calculs

### 10. **MapViewport - updateViewport à chaque progress**

**Fichier**: `src/app/MapScroller/components/MapViewport/index.tsx:155-157`

- **Problème**: `useLayoutEffect` déclenche `updateViewport` à chaque changement de `progress`
- **Impact**: GSAP `set` appelé à chaque frame (60fps)
- **Recommandation**: Throttle avec un seuil de changement minimal (`PROGRESS_THRESHOLD = 0.0001`)

### 11. **getActiveComponents à chaque progress**

**Fichier**: `src/templating/components/DynamicPathComponents.tsx:118`

- **Problème**: `pathDomain.getActiveComponents()` appelé à chaque changement de `progress`
- **Impact**: Parcours de tous les composants à chaque frame
- **Recommandation**: Cacher le résultat et ne recalculer que si le progress a changé significativement

## 🟢 LÉGERS - À Surveiller

### 12. **Hash update avec RAF et throttling**

**Fichier**: `src/templating/components/DynamicPathComponents.tsx:131-192`

- **Problème**: RAF + throttling complexe pour mettre à jour le hash
- **Impact**: Légère surcharge, mais nécessaire pour éviter trop de `history.replaceState`
- **Recommandation**: Garder mais simplifier si possible

### 13. **usePathCalculations - Recalculs fréquents**

**Fichier**: `src/app/MapScroller/hooks/usePathCalculations/index.ts`

- **Problème**: `getCurrentPointPosition` et `getCurrentPointAngle` recalculés à chaque render
- **Impact**: Appels à `getPointOnPath` et `getPathAngleAtProgress` (mais avec cache)
- **Recommandation**: Garder car le cache est efficace

## 📊 Résumé des Recommandations

### À Optimiser Immédiatement (P0):

1. ✅ **useDynamicZoom** - Désactiver par défaut
2. ✅ **Double RAF** - Supprimer dans `handleUserInteraction`
3. ✅ **checkScrollEnd RAF continu** - Remplacer par timeout
4. ✅ **Cacher getScrollDirection()** - Ne recalculer que si nécessaire
5. ✅ **Condition updateVelocity** - Ne pas appeler si désactivé

### À Optimiser si Possible (P1):

6. ⚠️ **Lazy loading DynamicPathComponents** - Calculer seulement les visibles
7. ⚠️ **Lazy loading DynamicPathTangenteComponents** - Calculer seulement les visibles
8. ⚠️ **Throttle PieceOfArt animations** - Utiliser `gsap.quickTo`
9. ⚠️ **Throttle updateViewport** - Seuil minimal de changement
10. ⚠️ **Cache getActiveComponents** - Seuil de changement significatif

### À Surveiller (P2):

11. ⚠️ **Throttle useProgressAnimation** - Si plusieurs composants
12. ⚠️ **Simplifier hash update** - Si possible

## 🎯 Impact Estimé

### Optimisations P0 (Critiques):

- **Réduction des calculs**: ~30-40%
- **Réduction des dispatches Redux**: ~20-30%
- **Amélioration de la fluidité**: Significative

### Optimisations P1 (Importantes):

- **Réduction des calculs**: ~50-70% (si beaucoup de composants)
- **Amélioration de la fluidité**: Modérée à élevée

### Optimisations P2 (Optionnelles):

- **Réduction des calculs**: ~10-20%
- **Amélioration de la fluidité**: Légère

## 📝 Notes d'Implémentation

### Cache de Direction

```typescript
const lastScrollDirectionRef = useRef<string | null>(null);

// Dans easingLoop et processScrollUpdate:
const direction = useCase.getScrollDirection();
if (direction && direction !== lastScrollDirectionRef.current) {
  lastScrollDirectionRef.current = direction;
  dispatch(setLastScrollDirection(direction));
}
```

### Timeout au lieu de RAF continu

```typescript
const scrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Remplacer le RAF continu par:
if (scrollEndTimeoutRef.current !== null) {
  clearTimeout(scrollEndTimeoutRef.current);
}
scrollEndTimeoutRef.current = setTimeout(() => {
  const isEnded = getUseCase().checkScrollEnd();
  if (isEnded) {
    if (onScrollState) onScrollState(false);
  }
}, SCROLL_CONFIG.SCROLL_END_DELAY);
```

### Condition updateVelocity

```typescript
// Avant chaque appel à updateVelocity:
if (velocityConfig.enabled) {
  useCase.updateVelocity(scrollYRef.current);
}
```
