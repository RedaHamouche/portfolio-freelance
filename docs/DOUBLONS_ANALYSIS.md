# Analyse Complète des Doublons dans MapScroller/hooks

## 📊 Résumé

**Total de doublons identifiés : 15 catégories**

---

## 🔴 DOUBLON #1 : Calcul de scrollY (CRITIQUE)

### Pattern dupliqué :

```typescript
const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
const maxScroll = calculateMaxScroll(fakeScrollHeight, getViewportHeight());
const scrollY = calculateScrollYFromProgress(progress, maxScroll);
window.scrollTo({ top: scrollY, behavior: "auto" });
```

### Fichiers concernés :

1. `useAutoPlay/actions/syncScrollPosition/index.ts` (lignes 18-30)
2. `useAutoScrollController/index.ts` (lignes 97-100)
3. `useScrollInitialization/index.ts` (lignes 78-89)
4. `useScrollInitialization/application/ScrollInitializationUseCase.ts` (lignes 84-86)
5. `useManualScrollSync/domain/ScrollProgressCalculator/index.ts` (lignes 25-26, 46-47)

### Différences :

- **Validation** : `useAutoPlay` et `useScrollInitialization` valident `isNaN()` et `!isFinite()`
- **Behavior** : `useAutoPlay` et `useAutoScrollController` utilisent `'auto'`, `useScrollInitialization` utilise `'instant'`
- **Gestion d'erreurs** : Différente dans chaque fichier

### Impact : 🔴 CRITIQUE

- **5 occurrences** du même pattern
- Logique métier dupliquée
- Risque d'incohérence si un bug est corrigé dans un seul endroit

---

## 🔴 DOUBLON #2 : Validation de scrollY (CRITIQUE)

### Pattern dupliqué :

```typescript
if (isNaN(scrollY) || !isFinite(scrollY)) {
  console.warn(`[hook] scrollY invalide: ${scrollY}, scroll ignoré`);
  return;
}
```

### Fichiers concernés :

1. `useAutoPlay/actions/syncScrollPosition/index.ts` (lignes 23-26)
2. `useScrollInitialization/index.ts` (lignes 83-87)

### Différences :

- Messages de log différents
- Gestion post-validation différente

### Impact : 🔴 CRITIQUE

- Validation critique dupliquée
- Risque de bugs si validation change

---

## 🔴 DOUBLON #3 : Mise à jour du progress dans Redux (CRITIQUE)

### Pattern dupliqué :

```typescript
dispatch(setProgress(newProgress));
```

### Fichiers concernés :

1. `useManualScrollSync/index.ts` (lignes 122, 131)
2. `useManualScrollSync/hooks/useEasingLoop.ts` (ligne 41)
3. `useManualScrollSync/actions/processScrollUpdate/index.ts` (ligne 84)
4. `useAutoPlay/index.ts` (ligne 118)
5. `useDirectionalScrollHandler/actions/updateProgress/index.ts` (ligne 13)
6. `useAutoScrollController/index.ts` (lignes 61, 78)

### Différences :

- Parfois combiné avec `setLastScrollDirection()`
- Parfois seul
- Pas de source unique de vérité

### Impact : 🔴 CRITIQUE

- **6 occurrences** directes
- Pas de validation centralisée
- Risque d'incohérence d'état

---

## 🟠 DOUBLON #4 : Création de pathDomain (MOYEN)

### Pattern dupliqué :

```typescript
const pathDomain = useMemo(() => createPathDomain(), []);
```

### Fichiers concernés :

1. `useAutoPlay/index.ts` (ligne 44)
2. `useAutoScrollController/index.ts` (ligne 25)
3. `useScrollInitialization/index.ts` (ligne 30)
4. `useManualScrollSync/index.ts` (via `scrollContext.pathDomain`)

### Différences :

- `useManualScrollSync` utilise le contexte (bon)
- Les autres créent leur propre instance

### Impact : 🟠 MOYEN

- **3 instances** créées inutilement
- Performance : création multiple d'un objet lourd
- Mais logique métier identique

---

## 🟠 DOUBLON #5 : Validation de progress (MOYEN)

### Pattern dupliqué :

```typescript
// Validation 1
if (progress < 0 || progress > 1 || isNaN(progress)) { ... }

// Validation 2
return !isNaN(progress) && progress >= 0 && progress <= 1;

// Validation 3
if (isNaN(progress) || progress < 0 || progress > 1) { ... }
```

### Fichiers concernés :

1. `useScrollInitialization/domain/ScrollInitializationService/index.ts` (ligne 60)
2. `useScrollInitialization/domain/ProgressInitializationService/index.ts` (ligne 170)
3. `useScrollInitialization/domain/ProgressPersistenceService/index.ts` (ligne 47)

### Différences :

- Ordre des conditions différent
- Messages d'erreur différents
- Logique identique mais implémentation différente

### Impact : 🟠 MOYEN

- **3 implémentations** de la même validation
- Risque d'incohérence

---

## 🟠 DOUBLON #6 : Vérification SSR (window === 'undefined') (MOYEN)

### Pattern dupliqué :

```typescript
if (typeof window === "undefined") return;
```

### Fichiers concernés :

1. `useManualScrollSync/index.ts` (ligne 148)
2. `useManualScrollSync/hooks/useScrollEventListeners.ts` (ligne 17)
3. `useManualScrollSync/hooks/useEasingLoop.ts` (ligne 31)
4. `useManualScrollSync/actions/processScrollUpdate/index.ts` (ligne 48)
5. `useManualScrollSync/actions/handleUserInteraction/index.ts` (ligne 46)
6. `useManualScrollSync/actions/handleScroll/index.ts` (ligne 40)
7. `useScrollInitialization/index.ts` (lignes 36, 67)
8. `useManualScrollSync/domain/ScrollProgressCalculator/index.ts` (lignes 21, 42)
9. `useScrollInitialization/domain/ProgressPersistenceService/index.ts` (lignes 14, 35, 64)

### Différences :

- Parfois avec commentaire `// SSR safety`
- Parfois sans commentaire
- Logique identique

### Impact : 🟠 MOYEN

- **9 occurrences** du même check
- Pattern répétitif mais nécessaire
- Peut être factorisé dans une fonction utilitaire

---

## 🟠 DOUBLON #7 : Validation de globalPathLength (MOYEN)

### Pattern dupliqué :

```typescript
// Pattern 1
if (globalPathLength <= 0) return;

// Pattern 2
if (globalPathLength <= 0 || globalPathLength <= DEFAULT_PATH_LENGTH) return;

// Pattern 3
if (!globalPathLength || globalPathLength <= DEFAULT_PATH_LENGTH) return;
```

### Fichiers concernés :

1. `useManualScrollSync/actions/processScrollUpdate/index.ts` (ligne 57)
2. `useManualScrollSync/actions/handleUserInteraction/index.ts` (ligne 56)
3. `useManualScrollSync/actions/handleScroll/index.ts` (ligne 45)
4. `useScrollInitialization/index.ts` (ligne 68)
5. `useManualScrollSync/index.ts` (ligne 152)

### Différences :

- Certains vérifient seulement `<= 0`
- D'autres vérifient aussi `<= DEFAULT_PATH_LENGTH`
- Logique similaire mais pas identique

### Impact : 🟠 MOYEN

- **5 occurrences** avec logique similaire
- Risque d'incohérence dans la validation

---

## 🟡 DOUBLON #8 : Hooks de refs similaires (FAIBLE)

### Pattern dupliqué :

```typescript
const progressRef = useRef(progress);
const globalPathLengthRef = useRef(globalPathLength);

useEffect(() => {
  progressRef.current = progress;
}, [progress]);

useEffect(() => {
  globalPathLengthRef.current = globalPathLength;
}, [globalPathLength]);
```

### Fichiers concernés :

1. `useAutoPlay/useAutoPlayStateRefs.ts` (lignes 19-20, 29-35)
2. `useDirectionalScrollHandler/useDirectionalScrollStateRefs.ts` (lignes 11-12, 15-21)
3. `useManualScrollSync/useScrollStateRefs.ts` (pas de synchronisation automatique)

### Différences :

- `useAutoPlayStateRefs` : synchronise `progress`, `globalPathLength`, `isAutoPlaying`, `isModalOpen`
- `useDirectionalScrollStateRefs` : synchronise seulement `progress` et `globalPathLength`
- `useScrollStateRefs` : pas de synchronisation automatique

### Impact : 🟡 FAIBLE

- Patterns similaires mais besoins différents
- Peut être factorisé partiellement

---

## 🟡 DOUBLON #9 : Gestion des timeouts (FAIBLE)

### Pattern dupliqué :

```typescript
if (timeoutRef.current) {
  clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
}
```

### Fichiers concernés :

1. `useAutoPlay/index.ts` (lignes 246-248)
2. `useAutoScrollController/index.ts` (lignes 117-119, 126-128)
3. `useAutoPlay/actions/clearPauseTimeout/index.ts` (lignes 14-16)
4. `useManualScrollSync/hooks/useScrollEndCheck.ts` (lignes 18-20)

### Différences :

- `clearPauseTimeout` fait aussi d'autres choses (dispatch, reset refs)
- Logique de base identique

### Impact : 🟡 FAIBLE

- Pattern simple mais répétitif
- Peut être factorisé

---

## 🟡 DOUBLON #10 : Gestion d'erreurs window.scrollTo() (FAIBLE)

### Pattern dupliqué :

```typescript
try {
  window.scrollTo({ top: scrollY, behavior: "auto" });
} catch (error) {
  console.warn("[hook] Erreur lors du scroll:", error);
}
```

### Fichiers concernés :

1. `useAutoPlay/actions/syncScrollPosition/index.ts` (lignes 17-34)
2. `useScrollInitialization/index.ts` (lignes 72-97)

### Différences :

- Messages de log différents
- Gestion post-erreur différente

### Impact : 🟡 FAIBLE

- **2 occurrences** seulement
- Mais logique identique

---

## 🟡 DOUBLON #11 : Vérification isModalOpen (FAIBLE)

### Pattern dupliqué :

```typescript
if (isModalOpen) return;
// ou
if (isModalOpenRef.current) return;
```

### Fichiers concernés :

1. `useManualScrollSync/actions/processScrollUpdate/index.ts` (ligne 49)
2. `useManualScrollSync/actions/handleUserInteraction/index.ts` (ligne 47)
3. `useManualScrollSync/actions/handleScroll/index.ts` (ligne 41)
4. `useAutoPlay/actions/syncScrollPosition/index.ts` (ligne 13)
5. `useAutoPlay/index.ts` (ligne 94)

### Différences :

- Parfois `isModalOpen` (prop)
- Parfois `isModalOpenRef.current` (ref)
- Logique identique

### Impact : 🟡 FAIBLE

- **5 occurrences** du même check
- Pattern simple mais répétitif

---

## 🟡 DOUBLON #12 : Services d'easing (FAIBLE - À VÉRIFIER)

### Services potentiellement similaires :

1. `useManualScrollSync/domain/ScrollEasingService/index.ts`
2. `useAutoPlay/domain/AutoPlayEasingService/index.ts`

### Analyse :

- **ScrollEasingService** : Interpolation linéaire avec inertie
- **AutoPlayEasingService** : Calcul de multiplicateur de vitesse basé sur proximité des composants

### Impact : 🟡 FAIBLE

- **Logique différente** : pas vraiment un doublon
- Mais nommage similaire peut prêter à confusion

---

## 🟡 DOUBLON #13 : Mise à jour de la direction du scroll (FAIBLE)

### Pattern dupliqué :

```typescript
dispatch(setLastScrollDirection(direction));
// Parfois combiné avec
dispatch(setAutoScrollDirection(autoScrollDirection));
```

### Fichiers concernés :

1. `useManualScrollSync/utils/updateScrollDirection/index.ts` (lignes 24-26)
2. `useDirectionalScrollHandler/actions/updateProgress/index.ts` (ligne 12)
3. `useAutoPlay/index.ts` (ligne 115)
4. `useAutoScrollController/index.ts` (ligne 59)

### Différences :

- Parfois seul `setLastScrollDirection`
- Parfois combiné avec `setAutoScrollDirection`
- Logique similaire mais pas identique

### Impact : 🟡 FAIBLE

- **4 occurrences** avec logique similaire
- Peut être centralisé

---

## 🟡 DOUBLON #14 : Patterns de RAF (requestAnimationFrame) (FAIBLE)

### Pattern dupliqué :

```typescript
refs.rafIdRef.current = requestAnimationFrame(() => {
  // ...
});
```

### Fichiers concernés :

1. `useManualScrollSync/actions/handleUserInteraction/index.ts` (ligne 97)
2. `useManualScrollSync/actions/handleScroll/index.ts` (ligne 54)
3. `useManualScrollSync/hooks/useEasingLoop.ts` (lignes 47, 65)
4. `useScrollInitialization/index.ts` (ligne 72)

### Différences :

- Callbacks différents
- Gestion des refs différente
- Pattern structurel identique

### Impact : 🟡 FAIBLE

- Pattern répétitif mais nécessaire
- Difficile à factoriser car callbacks différents

---

## 🟡 DOUBLON #15 : Cleanup de RAF (FAIBLE)

### Pattern dupliqué :

```typescript
if (refs.rafIdRef.current !== null) {
  cancelAnimationFrame(refs.rafIdRef.current);
}
```

### Fichiers concernés :

1. `useManualScrollSync/hooks/useScrollEventListeners.ts` (lignes 32-37)
2. `useAutoPlay/index.ts` (cleanup implicite via useRafLoop)

### Différences :

- `useAutoPlay` utilise `useRafLoop` (abstraction)
- `useManualScrollSync` gère manuellement

### Impact : 🟡 FAIBLE

- **2 occurrences** seulement
- Mais pattern répétitif

---

## 📊 Statistiques

| Priorité    | Nombre | Impact              |
| ----------- | ------ | ------------------- |
| 🔴 CRITIQUE | 3      | 13 occurrences      |
| 🟠 MOYEN    | 4      | 17 occurrences      |
| 🟡 FAIBLE   | 8      | 20+ occurrences     |
| **TOTAL**   | **15** | **50+ occurrences** |

---

## 🎯 Recommandations par Priorité

### 🔴 PRIORITÉ 1 : Doublons Critiques

1. **Créer `src/utils/scrollUtils/syncScrollPosition.ts`**

   - Source unique pour `window.scrollTo()`
   - Validation centralisée
   - Gestion d'erreurs unifiée

2. **Créer `src/app/MapScroller/services/ProgressUpdateService.ts`**

   - Source unique pour `dispatch(setProgress())`
   - Validation centralisée
   - Logging unifié

3. **Créer `src/utils/scrollUtils/calculateScrollY.ts`**
   - Wrapper autour des calculs existants
   - Validation centralisée

### 🟠 PRIORITÉ 2 : Doublons Moyens

4. **Créer `src/app/MapScroller/shared/PathDomainProvider.tsx`**

   - Singleton pour `pathDomain`
   - Évite les créations multiples

5. **Créer `src/utils/validation/isValidProgress.ts`**

   - Validation centralisée du progress

6. **Créer `src/utils/validation/isValidPathLength.ts`**
   - Validation centralisée du pathLength

### 🟡 PRIORITÉ 3 : Doublons Faibles

7. **Créer `src/utils/ssr/isBrowser.ts`**

   - Remplace `typeof window === 'undefined'`

8. **Créer `src/utils/timeout/clearTimeoutSafe.ts`**

   - Wrapper pour `clearTimeout` avec vérification null

9. **Créer `src/app/MapScroller/shared/useScrollStateRefs.ts`**
   - Hook de base pour les refs communes

---

## ✅ Contraintes Respectées

- ✅ **Non-régression** : Refactoring progressif, tests existants conservés
- ✅ **Performance** : Pas de dégradation, optimisations possibles (singleton pathDomain)
- ✅ **Testabilité** : Fonctions pures, facilement testables

---

## 📝 Prochaines Étapes

1. Valider cette analyse
2. Prioriser les refactorings
3. Créer les utilitaires partagés
4. Migrer progressivement les hooks
5. Supprimer les doublons
