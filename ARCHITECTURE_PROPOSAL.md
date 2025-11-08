# Proposition d'Architecture pour useManualScrollSync

## 🔍 Analyse de l'état actuel

### Problèmes identifiés

1. **Fichier trop long** : 582 lignes dans `index.ts`
2. **Responsabilités mélangées** :
   - Initialisation des services
   - Gestion des event listeners
   - Logique d'easing
   - Gestion des refs
   - Synchronisation Redux
3. **Pas de Provider** : Contrairement à `ModalProvider`, pas de centralisation
4. **Fonctions non testables individuellement** : Tout est dans le hook
5. **Structure pas claire** : Mélange DDD/React sans séparation nette

## 🎯 Objectifs

1. **Séparation des responsabilités** : Chaque fichier a un rôle clair
2. **Testabilité** : Chaque fonction peut être testée individuellement
3. **Lisibilité** : Structure de dossiers intuitive
4. **Réutilisabilité** : Composants réutilisables
5. **Cohérence** : Pattern similaire à `ModalProvider`

## 📐 Proposition d'Architecture

### Option 1 : Architecture avec Provider (Recommandée)

```
src/app/MapScroller/
├── contexts/
│   └── ScrollContext.tsx          # Provider centralisé (comme ModalProvider)
│
├── hooks/
│   ├── useManualScrollSync/
│   │   ├── index.ts               # Hook principal (minimal, ~50 lignes)
│   │   ├── hooks/
│   │   │   ├── useScrollEventListeners.ts    # Event listeners (wheel, touch, scroll)
│   │   │   ├── useEasingLoop.ts              # Boucle d'easing
│   │   │   ├── useScrollInitialization.ts     # Initialisation
│   │   │   └── useScrollHandlers.ts          # Handlers (userInteraction, scroll)
│   │   ├── utils/
│   │   │   ├── isInteractiveElement.ts      # Fonction pure, testable
│   │   │   ├── shouldReinitializeForPathLength.ts
│   │   │   └── updateScrollDirection.ts
│   │   ├── domain/                          # Services de domaine (existant)
│   │   ├── application/                      # Use cases (existant)
│   │   └── useScrollStateRefs.ts            # Refs (existant)
│   │
│   └── useAutoPlay/                         # (déjà bien structuré)
│
└── providers/
    └── ScrollProvider.tsx                    # Provider au niveau app
```

**Avantages** :

- ✅ Centralisation de la logique (comme ModalProvider)
- ✅ Services partagés entre plusieurs hooks
- ✅ Configuration centralisée
- ✅ Testabilité améliorée

**Inconvénients** :

- ⚠️ Refactoring plus important
- ⚠️ Nécessite de wrapper l'app

---

### Option 2 : Architecture modulaire sans Provider

```
src/app/MapScroller/hooks/useManualScrollSync/
├── index.ts                    # Hook principal (~100 lignes)
├── hooks/
│   ├── useScrollEventListeners.ts
│   ├── useEasingLoop.ts
│   ├── useScrollInitialization.ts
│   └── useScrollHandlers.ts
├── handlers/
│   ├── handleUserInteraction.ts    # Fonction pure, testable
│   ├── handleScroll.ts
│   └── processScrollUpdate.ts
├── utils/
│   ├── isInteractiveElement.ts
│   ├── shouldReinitializeForPathLength.ts
│   └── updateScrollDirection.ts
├── domain/                      # Services (existant)
├── application/                 # Use cases (existant)
└── useScrollStateRefs.ts       # Refs (existant)
```

**Avantages** :

- ✅ Moins de refactoring
- ✅ Séparation claire des responsabilités
- ✅ Testabilité améliorée
- ✅ Pas besoin de Provider

**Inconvénients** :

- ⚠️ Services recréés à chaque hook (mais déjà mémoïsés)

---

### Option 3 : Architecture hybride (Provider + Modules)

```
src/app/MapScroller/
├── contexts/
│   └── ScrollContext.tsx        # Provider pour services partagés
│
├── hooks/
│   └── useManualScrollSync/
│       ├── index.ts             # Hook principal (~80 lignes)
│       ├── hooks/                # Sous-hooks
│       ├── handlers/             # Handlers purs, testables
│       ├── utils/                # Utilitaires purs
│       ├── domain/               # Services
│       └── application/          # Use cases
│
└── providers/
    └── ScrollProvider.tsx       # Provider au niveau app
```

**Avantages** :

- ✅ Meilleur des deux mondes
- ✅ Services partagés via Provider
- ✅ Logique modulaire et testable
- ✅ Cohérence avec ModalProvider

---

## 🎨 Détails de l'Option 1 (Recommandée)

### 1. ScrollContext.tsx

```typescript
// Centralise les services et la configuration
export const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export const ScrollProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Services mémoïsés (créés une seule fois)
  const easingService = useMemo(() => new ScrollEasingService(...), []);
  const progressCalculator = useMemo(() => new ScrollProgressCalculator(), []);
  // ... autres services

  // Configuration
  const velocityConfig = useMemo(() => {...}, [isDesktop]);

  return (
    <ScrollContext.Provider value={{
      easingService,
      progressCalculator,
      // ... autres services
      velocityConfig,
    }}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScrollContext = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScrollContext must be used within ScrollProvider');
  }
  return context;
};
```

### 2. Hook principal simplifié

```typescript
// useManualScrollSync/index.ts (~50 lignes)
export function useManualScrollSync(
  globalPathLength: number,
  onScrollState?: (isScrolling: boolean) => void,
  isScrollSynced: boolean = true
) {
  const scrollContext = useScrollContext();
  const dispatch = useDispatch();

  // Sous-hooks
  const { refs } = useScrollStateRefs();
  const { initializeUseCase } = useScrollInitialization(scrollContext, refs);
  const { handleUserInteraction, handleScroll } = useScrollHandlers(
    scrollContext,
    refs,
    initializeUseCase
  );
  useScrollEventListeners(handleUserInteraction, handleScroll);
  useEasingLoop(scrollContext, refs, dispatch);

  // Initialisation
  useScrollInitializationEffect(
    globalPathLength,
    isScrollSynced,
    initializeUseCase
  );

  // Pas de logique métier ici, juste orchestration
}
```

### 3. Handlers testables

```typescript
// handlers/handleUserInteraction.ts
export function handleUserInteraction(
  event: Event,
  context: ScrollContextType,
  refs: ScrollStateRefs,
  initializeUseCase: (pathLength: number) => void
): void {
  // Logique pure, testable
  if (isInteractiveElement(event.target as HTMLElement)) {
    return;
  }
  // ... reste de la logique
}
```

### 4. Tests unitaires

```typescript
// handlers/handleUserInteraction.test.ts
describe("handleUserInteraction", () => {
  it("should ignore interactive elements", () => {
    const button = document.createElement("button");
    const event = { target: button } as Event;
    // Test pur, pas besoin de React
  });
});
```

---

## 📊 Comparaison des options

| Critère            | Option 1 (Provider) | Option 2 (Modulaire) | Option 3 (Hybride) |
| ------------------ | ------------------- | -------------------- | ------------------ |
| **Complexité**     | Moyenne             | Faible               | Élevée             |
| **Refactoring**    | Important           | Modéré               | Important          |
| **Testabilité**    | ⭐⭐⭐⭐⭐          | ⭐⭐⭐⭐             | ⭐⭐⭐⭐⭐         |
| **Cohérence**      | ⭐⭐⭐⭐⭐          | ⭐⭐⭐               | ⭐⭐⭐⭐⭐         |
| **Performance**    | ⭐⭐⭐⭐⭐          | ⭐⭐⭐⭐             | ⭐⭐⭐⭐⭐         |
| **Maintenabilité** | ⭐⭐⭐⭐⭐          | ⭐⭐⭐⭐             | ⭐⭐⭐⭐⭐         |

---

## 🚀 Plan d'implémentation (Option 1)

### Phase 1 : Extraction des utilitaires

1. ✅ Extraire `isInteractiveElement` → `utils/isInteractiveElement.ts`
2. ✅ Extraire `shouldReinitializeForPathLength` → `utils/shouldReinitializeForPathLength.ts`
3. ✅ Extraire `updateScrollDirection` → `utils/updateScrollDirection.ts`
4. ✅ Créer les tests unitaires

### Phase 2 : Extraction des handlers

1. Extraire `handleUserInteraction` → `handlers/handleUserInteraction.ts`
2. Extraire `handleScroll` → `handlers/handleScroll.ts`
3. Extraire `processScrollUpdate` → `handlers/processScrollUpdate.ts`
4. Créer les tests unitaires

### Phase 3 : Création des sous-hooks

1. Créer `hooks/useScrollEventListeners.ts`
2. Créer `hooks/useEasingLoop.ts`
3. Créer `hooks/useScrollInitialization.ts`
4. Créer `hooks/useScrollHandlers.ts`

### Phase 4 : Création du Provider

1. Créer `contexts/ScrollContext.tsx`
2. Créer `providers/ScrollProvider.tsx`
3. Intégrer dans l'app

### Phase 5 : Simplification du hook principal

1. Refactoriser `index.ts` pour utiliser les sous-hooks
2. Réduire à ~50-80 lignes
3. Tests d'intégration

---

## 💡 Recommandation

**Option 1 (Provider)** est recommandée car :

1. ✅ Cohérence avec `ModalProvider`
2. ✅ Meilleure performance (services partagés)
3. ✅ Testabilité maximale
4. ✅ Architecture claire et maintenable
5. ✅ Facilite l'ajout de nouvelles fonctionnalités

**Mais** on peut commencer par **Option 2** (modulaire) pour :

- Moins de refactoring initial
- Validation de l'approche
- Migration progressive vers Option 1 si besoin

---

## ❓ Questions à discuter

1. Préférez-vous Option 1, 2 ou 3 ?
2. Voulez-vous commencer par Option 2 puis migrer vers Option 1 ?
3. Le Provider est-il vraiment nécessaire ou Option 2 suffit ?
4. Y a-t-il d'autres hooks qui pourraient bénéficier du Provider ?
