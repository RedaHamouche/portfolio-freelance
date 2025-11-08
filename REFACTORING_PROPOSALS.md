# Propositions de Refactorisation

## 🎯 Objectif

Améliorer la lisibilité, la maintenabilité et réduire la complexité du code.

---

## 1. Extraire la logique d'initialisation

### Problème actuel

L'initialisation est dupliquée dans 3 endroits :

- `handleUserInteraction` (lignes 275-293)
- `handleScroll` (lignes 379-397)
- `useEffect` d'initialisation (lignes 472-534)

### Solution proposée

Créer un hook `useScrollInitialization` interne ou une fonction utilitaire :

```typescript
// Dans useManualScrollSync/index.ts
const initializeUseCase = useCallback(
  (pathLength: number, progress?: number) => {
    try {
      getUseCase().initialize(pathLength, progress);
      lastInitializedPathLengthRef.current = pathLength;
      isInitializedRef.current = true;
    } catch (error) {
      console.error(
        "[useManualScrollSync] Erreur lors de l'initialisation:",
        error
      );
      // Recréer le useCase en cas d'erreur
      useCaseRef.current = new ManualScrollSyncUseCase(
        easingService,
        progressCalculator,
        stateDetector,
        velocityService,
        velocityConfig
      );
      useCaseRef.current.initialize(pathLength, progress);
      lastInitializedPathLengthRef.current = pathLength;
      isInitializedRef.current = true;
    }
  },
  [
    getUseCase,
    easingService,
    progressCalculator,
    stateDetector,
    velocityService,
    velocityConfig,
  ]
);
```

**Avantages** :

- ✅ Réduction de ~60 lignes de code dupliqué
- ✅ Un seul point de gestion d'erreur
- ✅ Plus facile à tester et maintenir

---

## 2. Extraire la logique de direction

### Problème actuel

La logique de direction est dupliquée dans `easingLoop` (lignes 179-188) et `processScrollUpdate` (lignes 247-256).

### Solution proposée

Créer une fonction utilitaire :

```typescript
const updateScrollDirection = useCallback(
  (useCase: ManualScrollSyncUseCase) => {
    if (isAutoPlayingRef.current) return;

    const direction = useCase.getScrollDirection();
    if (direction && direction !== lastScrollDirectionRef.current) {
      lastScrollDirectionRef.current = direction;
      dispatch(setLastScrollDirection(direction));
      const autoScrollDirection = direction === "forward" ? 1 : -1;
      dispatch(setAutoScrollDirection(autoScrollDirection));
    }
  },
  [dispatch]
);
```

**Avantages** :

- ✅ Réduction de ~18 lignes de code dupliqué
- ✅ Logique centralisée

---

## 3. Extraire la détection du changement de pathLength

### Problème actuel

La logique de détection du changement de `pathLength` est dupliquée dans le `useEffect` de synchronisation autoplay (lignes 109-140).

### Solution proposée

Créer une fonction utilitaire :

```typescript
const shouldReinitializeForPathLength = useCallback(
  (currentPathLength: number): boolean => {
    const pathLengthChanged =
      lastInitializedPathLengthRef.current !== currentPathLength;
    const wasDefaultValue =
      lastInitializedPathLengthRef.current <= DEFAULT_PATH_LENGTH;
    const isRealValue = currentPathLength > DEFAULT_PATH_LENGTH;

    return (
      pathLengthChanged &&
      wasDefaultValue &&
      isRealValue &&
      isInitializedRef.current
    );
  },
  []
);
```

**Avantages** :

- ✅ Logique centralisée et testable
- ✅ Plus facile à comprendre

---

## 4. Créer une constante pour la valeur par défaut

### Problème actuel

Le magic number `2000` est utilisé partout (lignes 109, 112, 113, 214, 268, 373, 478).

### Solution proposée

Déjà fait dans `src/config/index.ts` avec `DEFAULT_PATH_LENGTH`, mais pas utilisé partout.

**Action** : Remplacer tous les `2000` par `DEFAULT_PATH_LENGTH`.

---

## 5. Simplifier les dépendances des useEffect

### Problème actuel

Le `useEffect` d'initialisation (ligne 534) a 12 dépendances, ce qui cause des réexécutions fréquentes.

### Solution proposée

Utiliser des refs pour les valeurs qui ne doivent pas déclencher de réexécution :

```typescript
// Au lieu de mettre currentProgress dans les dépendances
const currentProgressRef = useRef(currentProgress);
useEffect(() => {
  currentProgressRef.current = currentProgress;
}, [currentProgress]);

// Utiliser currentProgressRef.current dans le useEffect
```

**Avantages** :

- ✅ Moins de réexécutions inutiles
- ✅ Meilleure performance

---

## 6. Créer un hook personnalisé pour la gestion des refs

### Problème actuel

12 refs différentes dans le hook principal, difficile à suivre.

### Solution proposée

Créer un hook `useScrollStateRefs` :

```typescript
const useScrollStateRefs = () => {
  const isInitializedRef = useRef(false);
  const lastInitializedPathLengthRef = useRef<number>(0);
  const scrollYRef = useRef(0);
  const scrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef(false);
  const easingRafIdRef = useRef<number | null>(null);
  const isEasingActiveRef = useRef(false);
  const isAutoPlayingRef = useRef(false);
  const prevIsAutoPlayingRef = useRef(false);
  const lastScrollDirectionRef = useRef<string | null>(null);

  return {
    isInitializedRef,
    lastInitializedPathLengthRef,
    scrollYRef,
    scrollEndTimeoutRef,
    rafIdRef,
    pendingUpdateRef,
    easingRafIdRef,
    isEasingActiveRef,
    isAutoPlayingRef,
    prevIsAutoPlayingRef,
    lastScrollDirectionRef,
  };
};
```

**Avantages** :

- ✅ Organisation claire
- ✅ Plus facile à tester

---

## 7. Extraire la logique de scroll end detection

### Problème actuel

La logique de détection de fin de scroll est dupliquée dans `handleUserInteraction` (lignes 340-356) et `handleScroll` (lignes 422-438).

### Solution proposée

Créer une fonction utilitaire :

```typescript
const scheduleScrollEndCheck = useCallback(() => {
  if (scrollEndTimeoutRef.current !== null) {
    clearTimeout(scrollEndTimeoutRef.current);
    scrollEndTimeoutRef.current = null;
  }

  scrollEndTimeoutRef.current = setTimeout(() => {
    const isEnded = getUseCase().checkScrollEnd();
    if (isEnded && onScrollState) {
      onScrollState(false);
    }
    scrollEndTimeoutRef.current = null;
  }, SCROLL_CONFIG.SCROLL_END_DELAY);
}, [getUseCase, onScrollState]);
```

**Avantages** :

- ✅ Réduction de ~36 lignes de code dupliqué
- ✅ Logique centralisée

---

## 📊 Impact Estimé

### Réduction de code

- **Avant** : ~536 lignes
- **Après** : ~350-400 lignes (réduction de ~25-35%)

### Amélioration de la maintenabilité

- ✅ Moins de duplication
- ✅ Logique centralisée
- ✅ Plus facile à tester
- ✅ Plus facile à comprendre

### Amélioration de la performance

- ✅ Moins de réexécutions de `useEffect`
- ✅ Code plus optimisé

---

## 🚀 Plan d'Implémentation

### Phase 1 : Extraction des utilitaires (2-3h)

1. Extraire `initializeUseCase`
2. Extraire `updateScrollDirection`
3. Extraire `scheduleScrollEndCheck`
4. Extraire `shouldReinitializeForPathLength`

### Phase 2 : Refactorisation des refs (1-2h)

1. Créer `useScrollStateRefs`
2. Simplifier les dépendances des `useEffect`

### Phase 3 : Nettoyage (1h)

1. Remplacer tous les `2000` par `DEFAULT_PATH_LENGTH`
2. Supprimer les commentaires "CRITIQUE" devenus inutiles
3. Ajouter des tests pour les nouvelles fonctions

---

## ✅ Checklist de Validation

- [ ] Tous les tests passent
- [ ] Aucune régression fonctionnelle
- [ ] Code plus court et plus lisible
- [ ] Moins de duplication
- [ ] Performance maintenue ou améliorée

---

## 📝 Notes

Ces refactorisations sont **optionnelles** et peuvent être faites progressivement. Le code actuel fonctionne, mais ces améliorations rendront le code plus maintenable à long terme.
