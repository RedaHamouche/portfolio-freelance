# Analyse de Performance - Optimisations Identifiées

## 🔍 Problèmes de Performance Identifiés

### 1. **PathDomain - Recherches O(n) répétées**

**Fichier**: `src/templating/domains/path/api.ts`

**Problème**:

- `getComponentById()` : utilise `.find()` à chaque appel → O(n)
- `getComponentByAnchorId()` : utilise `.find()` à chaque appel → O(n)
- `getAllComponents()` est appelé à chaque recherche, puis `.find()` itère sur tous les composants

**Impact**: Si vous avez 50 composants, chaque recherche parcourt 50 éléments

**Solution**: Créer des Maps indexées par ID et anchorId dans le repository

```typescript
// Dans PathRepository
private idIndex: Map<string, PathComponent> = new Map();
private anchorIdIndex: Map<string, PathComponent> = new Map();
```

**Gain**: O(1) au lieu de O(n) pour les recherches par ID/anchorId

---

### 2. **pathCalculations.ts - Tri répété à chaque recherche**

**Fichier**: `src/utils/pathCalculations.ts`

**Problème**:

- `sortComponents()` est appelé à chaque `findNextComponentInDirection()`
- Trie les arrays complets à chaque fois → O(n log n) à chaque recherche
- Les arrays triés ne sont pas mis en cache

**Impact**: Si vous cherchez le prochain composant 60 fois par seconde (scroll), vous triez 60 fois

**Solution**: Mettre en cache les arrays triés dans le PathDomain

```typescript
// Dans PathDomain
private sortedComponentsCache: {
  asc: PathComponent[];
  desc: PathComponent[];
} | null = null;
```

**Gain**: O(n log n) une seule fois au chargement, puis O(log n) avec recherche binaire

---

### 3. **findNextComponentInDirection - Utilise .find() au lieu de recherche binaire**

**Fichier**: `src/utils/pathCalculations.ts`

**Problème**:

- Utilise `.find()` sur un array trié → O(n)
- Pourrait utiliser une recherche binaire → O(log n)

**Solution**: Implémenter une recherche binaire pour les arrays triés

```typescript
function binarySearchForward(
  sorted: PathComponentData[],
  target: number
): PathComponentData | null {
  let left = 0;
  let right = sorted.length - 1;
  let result = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (sorted[mid].position.progress > target) {
      result = sorted[mid];
      right = mid - 1; // Chercher plus tôt
    } else {
      left = mid + 1;
    }
  }
  return result;
}
```

**Gain**: O(log n) au lieu de O(n)

---

### 4. **DynamicPathComponents - getActiveComponents appelé N fois**

**Fichier**: `src/templating/components/DynamicPathComponents.tsx`

**Problème**:

```typescript
const activeAnchors = React.useMemo(
  () =>
    pathComponents.map((component) => {
      const activeComponents = pathDomain.getActiveComponents(
        progress,
        isDesktop
      ); // ⚠️ Appelé N fois
      return activeComponents.some((ac) => ac.id === component.id);
    }),
  [progress, pathComponents, pathDomain, isDesktop]
);
```

- `getActiveComponents()` est appelé pour chaque composant → O(n²)
- Filtre tous les composants à chaque itération

**Solution**: Calculer une seule fois et utiliser un Set

```typescript
const activeComponentIds = useMemo(() => {
  const active = pathDomain.getActiveComponents(progress, isDesktop);
  return new Set(active.map((c) => c.id));
}, [progress, pathDomain, isDesktop]);

const activeAnchors = useMemo(
  () => pathComponents.map((c) => activeComponentIds.has(c.id)),
  [pathComponents, activeComponentIds]
);
```

**Gain**: O(n) au lieu de O(n²)

---

### 5. **getActiveComponents - Filtre linéaire répété**

**Fichier**: `src/templating/domains/path/api.ts`

**Problème**:

```typescript
getActiveComponents(currentProgress: number, isDesktop: boolean = true): PathComponent[] {
  const components = this.getAllComponents(isDesktop);
  return components.filter(c =>
    isComponentActive(c.position.progress, currentProgress)
  );
}
```

- Filtre tous les composants à chaque appel → O(n)

**Solution**: Utiliser un index spatial ou un interval tree pour les recherches par range

- Alternative plus simple : mettre en cache les composants actifs si le progress n'a pas changé significativement

**Gain**: Réduction des appels inutiles

---

### 6. **PathRepository - Pas de cache d'indexation**

**Fichier**: `src/templating/domains/path/repository.ts`

**Problème**:

- Charge les composants depuis JSON mais ne crée pas d'index
- Chaque recherche doit parcourir tous les composants

**Solution**: Créer des index au chargement

```typescript
class PathRepository {
  private desktopConfig: PathComponentsConfig | null = null;
  private mobileConfig: PathComponentsConfig | null = null;

  // Index pour recherches rapides
  private desktopIdIndex: Map<string, PathComponent> | null = null;
  private desktopAnchorIdIndex: Map<string, PathComponent> | null = null;
  private mobileIdIndex: Map<string, PathComponent> | null = null;
  private mobileAnchorIdIndex: Map<string, PathComponent> | null = null;

  private buildIndexes(config: PathComponentsConfig) {
    const idIndex = new Map();
    const anchorIdIndex = new Map();

    config.forEach((component) => {
      idIndex.set(component.id, component);
      if (component.anchorId) {
        anchorIdIndex.set(component.anchorId, component);
      }
    });

    return { idIndex, anchorIdIndex };
  }
}
```

**Gain**: O(1) pour les recherches par ID/anchorId

---

### 7. **getNextAnchor - Utilise .find() au lieu d'optimisation**

**Fichier**: `src/utils/pathCalculations.ts`

**Problème**:

```typescript
export const getNextAnchor = (
  fromProgress: number,
  toProgress: number,
  components: PathComponentData[],
  tolerance: number = 0.002
): PathComponentData | null => {
  return (
    components.find((c) => {
      // ... logique de vérification
    }) || null
  );
};
```

- Parcourt tous les composants → O(n)
- Pourrait utiliser un index spatial ou une recherche binaire

**Solution**: Filtrer d'abord les composants dans la plage, puis chercher

```typescript
// Filtrer les composants dans la plage (plus efficace)
const candidates = components.filter((c) => {
  if (!c.autoScrollPauseTime || c.autoScrollPauseTime <= 0) return false;
  // Logique de plage optimisée
});
// Puis chercher le plus proche
```

**Gain**: Réduction du nombre de composants à vérifier

---

### 8. **DynamicPathComponents - Calcul de positions répété**

**Fichier**: `src/templating/components/DynamicPathComponents.tsx`

**Problème**:

- Les positions sont recalculées même si seul le progress change
- `getPointOnPath` est appelé pour chaque composant à chaque render

**Solution**: Mettre en cache les positions calculées et ne recalculer que si nécessaire

```typescript
// Cache des positions par progress
const positionCache = useRef<Map<number, { x: number; y: number }>>(new Map());
```

**Gain**: Évite les recalculs inutiles de `getPointAtLength()` (coûteux)

---

## 📊 Résumé des Optimisations

| Fichier                               | Problème               | Complexité Actuelle     | Complexité Optimisée | Gain                     |
| ------------------------------------- | ---------------------- | ----------------------- | -------------------- | ------------------------ |
| `PathDomain.getComponentById`         | `.find()` linéaire     | O(n)                    | O(1) avec Map        | **100x** (50 composants) |
| `PathDomain.getComponentByAnchorId`   | `.find()` linéaire     | O(n)                    | O(1) avec Map        | **100x** (50 composants) |
| `sortComponents`                      | Tri à chaque recherche | O(n log n) × recherches | O(n log n) une fois  | **60x** (60fps)          |
| `findNextComponentInDirection`        | `.find()` sur trié     | O(n)                    | O(log n) binaire     | **8x** (50 composants)   |
| `DynamicPathComponents.activeAnchors` | O(n²) avec `.some()`   | O(n²)                   | O(n) avec Set        | **50x** (50 composants)  |
| `getNextAnchor`                       | `.find()` linéaire     | O(n)                    | O(log n) avec index  | **8x** (50 composants)   |

---

## 🚀 Plan d'Implémentation Recommandé

### Phase 1 : Indexation (Impact élevé, effort moyen)

1. Ajouter des Maps dans PathRepository pour ID et anchorId
2. Mettre à jour PathDomain pour utiliser les index
3. **Gain estimé**: 50-100x sur les recherches par ID

### Phase 2 : Cache des arrays triés (Impact élevé, effort faible)

1. Mettre en cache les arrays triés dans PathDomain
2. Invalider le cache uniquement si les composants changent
3. **Gain estimé**: 60x sur les recherches de direction (60fps)

### Phase 3 : Recherche binaire (Impact moyen, effort moyen)

1. Implémenter recherche binaire pour `findNextComponentInDirection`
2. **Gain estimé**: 8x sur les recherches directionnelles

### Phase 4 : Optimisation DynamicPathComponents (Impact élevé, effort faible)

1. Utiliser Set pour `activeAnchors`
2. **Gain estimé**: 50x sur le calcul des composants actifs

### Phase 5 : Cache des positions (Impact moyen, effort moyen)

1. Mettre en cache les positions calculées
2. **Gain estimé**: Réduction des appels coûteux à `getPointAtLength()`

---

## 🎯 Autres Optimisations Possibles

### 1. **Lazy Loading des Composants**

- Ne charger que les composants proches du viewport
- Utiliser IntersectionObserver de manière plus agressive

### 2. **Virtualisation**

- Ne rendre que les composants visibles
- Utiliser react-window ou react-virtual

### 3. **Debouncing des Calculs**

- Debouncer les calculs de position pendant le scroll rapide
- Calculer seulement à la fin du scroll

### 4. **Web Workers**

- Déplacer les calculs lourds (tri, recherche) dans un Web Worker
- Éviter de bloquer le thread principal

### 5. **Memoization Aggressive**

- Utiliser `useMemo` plus agressivement pour les calculs coûteux
- Éviter les recalculs inutiles

---

## 📝 Notes

- Les optimisations sont classées par impact/effort
- Commencer par Phase 1 et 2 pour le meilleur ROI
- Tester les performances avant/après chaque optimisation
- Utiliser React DevTools Profiler pour mesurer l'impact réel
