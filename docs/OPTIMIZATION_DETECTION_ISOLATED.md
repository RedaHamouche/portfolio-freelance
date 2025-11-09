# Optimisation: Détection Isolée dans Chaque Composant

## 🎯 Objectif

Déplacer la logique de détection `inView` et `isActive` dans chaque composant individuel pour améliorer les performances.

## 📊 Problème Actuel

### Structure Actuelle (Centralisée)

```typescript
// Dans DynamicPathComponents (parent)
const activeComponentIds = React.useMemo(() => {
  const activeComponents = pathDomain.getActiveComponents(progress, isDesktop);
  return new Set(activeComponents.map((c) => c.id));
}, [progress, pathDomain, isDesktop]);

const activeAnchors = React.useMemo(
  () => pathComponents.map((c) => activeComponentIds.has(c.id)), // ❌ O(n) à chaque changement
  [pathComponents, activeComponentIds]
);

const inViews = useMultipleInView(refs, activeAnchors, 0.1);

// Dans useMultipleInView
const [inViews, setInViews] = useState<boolean[]>(refs.map(() => false));

useEffect(() => {
  // ...
  const observer = new IntersectionObserver(
    ([entry]) => {
      setInViews((prev) => {
        const copy = [...prev]; // ❌ Copie tout le tableau à chaque changement
        copy[idx] = entry.isIntersecting;
        return copy;
      });
    },
    { threshold }
  );
  // ...
}, [refs.length, isNears.join(",")]); // ❌ Re-crée les observers si isNears change
```

### Problèmes Identifiés

1. **Tableau global `inViews`** : Copie complète à chaque changement d'un seul composant
2. **Calcul `activeAnchors`** : `.map()` sur tous les composants à chaque changement
3. **Re-renders** : Tous les composants reçoivent le tableau même s'ils n'ont pas changé
4. **Dépendances** : `isNears.join(',')` cause des re-créations d'observers

---

## ✅ Solution Proposée

### Structure Cible (Isolée)

```typescript
// Dans DynamicPathComponents (parent) - SIMPLIFIÉ
const activeComponentIds = React.useMemo(() => {
  const activeComponents = pathDomain.getActiveComponents(progress, isDesktop);
  return new Set(activeComponents.map((c) => c.id));
}, [progress, pathDomain, isDesktop]);

// Plus besoin de activeAnchors ni useMultipleInView !

return (
  <>
    {pathComponents.map((component, idx) => (
      <MemoizedPathComponent
        key={component.id}
        component={component}
        position={positions[idx]}
        mapScale={mapScale}
        activeComponentIds={activeComponentIds} // ✅ Set passé en prop
      />
    ))}
  </>
);
```

```typescript
// Dans MemoizedPathComponent - LOGIQUE ISOLÉE
const MemoizedPathComponent = memo(function PathComponentMemo({
  component,
  position,
  mapScale,
  activeComponentIds, // Set passé en prop
}: Props) {
  const refDiv = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // ✅ Calcul isolé : O(1) lookup
  const isActive = activeComponentIds.has(component.id);

  // ✅ IntersectionObserver isolé
  useEffect(() => {
    if (!refDiv.current || !isActive) {
      // Si pas actif, ne pas observer et cacher
      setInView(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting); // ✅ Seul ce composant se met à jour
      },
      { threshold: 0.1 }
    );

    observer.observe(refDiv.current);
    return () => observer.disconnect();
  }, [isActive]); // ✅ Dépendance simple

  return (
    <div
      ref={refDiv}
      style={{
        opacity: inView ? 1 : 0, // Opacity directe
        position: "absolute",
        top: position.y,
        left: position.x,
        transform: `translate(-50%, -50%) scale(${1 / mapScale})`,
        // ...
      }}
    >
      {Comp && <Comp {...component} />}
    </div>
  );
});
```

---

## 📈 Gains Attendus

### Performance

1. **Pas de copie de tableau** : Chaque composant gère son propre état
2. **Re-renders isolés** : Seul le composant concerné se re-render
3. **Calcul `isActive` isolé** : O(1) lookup par composant (au lieu de O(n) dans le parent)
4. **IntersectionObserver isolé** : Plus simple à gérer, moins de dépendances
5. **Moins de re-créations** : Pas de `isNears.join(',')` qui force la re-création

**Gain estimé**: **20-40% de performance CPU**, surtout avec beaucoup de composants (50+)

### Maintenabilité

- Code plus simple et plus lisible
- Logique isolée = plus facile à déboguer
- Moins de dépendances entre composants

---

## 🔧 Implémentation

### Fichiers à Modifier

1. **`src/templating/components/DynamicPathComponents.tsx`**

   - Supprimer `useMultipleInView` (lignes 27-54)
   - Supprimer le calcul de `activeAnchors` (lignes 165-168)
   - Supprimer `const inViews = useMultipleInView(...)` (ligne 171)
   - Passer `activeComponentIds` en prop à `MemoizedPathComponent`
   - Supprimer `refDiv` et `inView` des props de `MemoizedPathComponent`

2. **`MemoizedPathComponent`** (dans le même fichier)
   - Ajouter `activeComponentIds` dans les props
   - Créer `refDiv` avec `useRef` dans le composant
   - Ajouter `const [inView, setInView] = useState(false)`
   - Ajouter le calcul `const isActive = activeComponentIds.has(component.id)`
   - Ajouter l'`useEffect` pour `IntersectionObserver`
   - Utiliser `inView` directement dans le style

### Étapes

1. Modifier `MemoizedPathComponent` pour accepter `activeComponentIds`
2. Déplacer la logique `IntersectionObserver` dans le composant
3. Supprimer `useMultipleInView` du parent
4. Supprimer `activeAnchors` du parent
5. Passer `activeComponentIds` en prop
6. Tester que tout fonctionne
7. Vérifier les performances

---

## ⚠️ Points d'Attention

1. **Plus d'observers** : Un observer par composant au lieu d'un tableau centralisé

   - ✅ Le navigateur gère bien plusieurs observers
   - ✅ Chaque observer est indépendant et plus simple

2. **Props supplémentaires** : `activeComponentIds` doit être passé en prop

   - ✅ C'est un Set, donc très léger (référence)
   - ✅ Déjà calculé dans le parent, pas de duplication

3. **Tests** : Mettre à jour les tests pour refléter la nouvelle structure
   - Tester que chaque composant gère son propre `inView`
   - Tester que `isActive` est calculé correctement

---

## 📝 Notes Techniques

### IntersectionObserver

- L'API `IntersectionObserver` est native et très performante
- Un observer par composant n'est pas un problème de performance
- Le navigateur optimise automatiquement les observers

### React.memo

- `MemoizedPathComponent` est déjà enveloppé dans `memo()`
- Avec la logique isolée, les re-renders seront encore plus optimisés
- Seul le composant qui change se re-render

### Set vs Array

- `activeComponentIds` est un `Set` pour O(1) lookup
- Passer un Set en prop est très léger (juste une référence)
- Pas de copie nécessaire

---

## 🎯 Résultat Attendu

- ✅ Code plus simple et maintenable
- ✅ Meilleures performances (20-40% CPU)
- ✅ Re-renders isolés
- ✅ Moins de dépendances
- ✅ Architecture plus claire
