# Architecture du Projet - Guide de Référence

## Principes

1. **DDD (Domain-Driven Design)** : Séparation claire entre domain, application, et infrastructure
2. **Fonctions pures et testables** : Toute logique métier doit être testable unitairement
3. **Providers pour le partage** : Utiliser React Context pour partager les services entre hooks
4. **Tests co-localisés** : Chaque fichier a son test à côté dans un dossier nommé clairement

## Structure Standard d'un Hook

```
HookName/
├── index.ts                    # Hook principal (point d'entrée)
├── index.test.ts               # Tests du hook principal
│
├── application/                # Use Cases (orchestration métier)
│   ├── UseCaseName/
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── index.ts                # Export centralisé
│
├── domain/                     # Services de domaine (logique pure)
│   ├── ServiceName/
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── index.ts                # Export centralisé
│
├── actions/                    # Actions avec effets de bord (dispatch Redux, setTimeout, window.scrollTo, etc.)
│   ├── actionName/
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── index.ts                # Export centralisé
│
├── hooks/                      # Sous-hooks React (composition)
│   ├── useSomething/
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── index.ts                # Export centralisé
│
├── utils/                      # Fonctions utilitaires pures (sans effets de bord)
│   ├── functionName/
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── index.ts                # Export centralisé
│
└── providers/                  # Providers React (si nécessaire)
    ├── ProviderName/
    │   ├── index.tsx
    │   └── index.test.tsx
    └── index.ts                # Export centralisé
```

## Règles de Classification

### `application/` - Use Cases

- Orchestrent plusieurs services de domaine
- Contiennent la logique métier complexe
- Peuvent avoir des effets de bord (mais via dépendances injectées)
- Exemple : `AutoPlayUseCase`, `ManualScrollSyncUseCase`

### `domain/` - Services de Domaine

- Logique métier pure, sans effets de bord
- Facilement testables unitairement
- Pas de dépendances React/Redux
- Exemple : `AutoPlayProgressService`, `ScrollEasingService`

### `actions/` - Actions

- **Fonctions avec effets de bord** (dispatch Redux, setTimeout, window.scrollTo, etc.)
- Modifient l'état ou déclenchent des effets secondaires
- Chaque action dans son propre dossier avec tests
- **Critères pour placer dans `actions/`** :
  - Utilise `dispatch()` Redux
  - Utilise `ProgressUpdateService` ou autres services avec effets de bord
  - Appelle `window.scrollTo()`, `setTimeout()`, `requestAnimationFrame()`
  - Modifie le DOM directement
  - Accède à `localStorage` ou `sessionStorage`
- Exemple : `handlePauseOnAnchor`, `clearPauseTimeout`, `syncScrollPosition`, `updateScrollDirection`

### `hooks/` - Sous-hooks React

- Hooks React personnalisés pour la composition
- Réutilisables dans d'autres hooks
- Chaque hook dans son propre dossier avec tests
- Exemple : `useEasingLoop`, `useScrollHandlers`

### `utils/` - Utilitaires

- **Fonctions pures uniquement** (sans effets de bord)
- **Critères pour placer dans `utils/`** :
  - Pas de `dispatch()` Redux
  - Pas de `ProgressUpdateService` ou services avec effets de bord
  - Pas de `window.scrollTo()`, `setTimeout()`, `requestAnimationFrame()`
  - Pas de modification du DOM
  - Pas d'accès à `localStorage` ou `sessionStorage`
  - Fonction pure : même input → même output
  - Facilement testable (pas besoin de mocker Redux, window, ou services)
- Exemple : `canPauseOnAnchor`, `createAutoPlayUseCase`, `isInteractiveElement`, `shouldReinitializeForPathLength`

#### ⚠️ Règle d'Or : Actions vs Utils

**Si la fonction a des effets de bord → `actions/`**  
**Si la fonction est pure → `utils/`**

**Exemple de confusion résolue** :

- ❌ `updateScrollDirection` était dans `utils/` mais utilise `ProgressUpdateService` (effet de bord)
- ✅ Déplacé vers `actions/updateScrollDirection/`

### `providers/` - Providers

- Providers React Context pour partager des services
- Utilisés quand plusieurs hooks partagent les mêmes services
- Exemple : `ScrollContextProvider`

## Conventions de Nommage

- **Fichiers** : `camelCase.ts` ou `PascalCase.tsx` (pour composants)
- **Dossiers** : `camelCase/`
- **Tests** : Toujours `index.test.ts` à côté du fichier source

## Stratégie des Barrel Files (Index.ts)

### ✅ Utilisation des Barrel Files

**Barrel files utilisés** :

- **Services de domaine** : Chaque service a son `index.ts` dans son dossier
  - Exemple : `domain/ServiceName/index.ts` exporte `ServiceName`
  - **Raison** : Organisation claire, chaque service dans son propre dossier avec son test

**Barrel files NON utilisés** :

- **Use Cases** : Pas de `index.ts` dans `application/`
  - Exemple : `application/UseCaseName/index.ts` (pas de barrel file au niveau application/)
  - **Raison** : Tree-shaking optimisé, imports directs depuis `application/UseCaseName/`
- **Actions** : Pas de `index.ts` dans `actions/`
  - **Raison** : Tree-shaking optimisé, imports directs depuis `actions/actionName/`
- **Hooks** : Pas de `index.ts` dans `hooks/`
  - **Raison** : Tree-shaking optimisé, imports directs depuis `hooks/hookName/`
- **Utils** : Pas de `index.ts` dans `utils/`
  - **Raison** : Tree-shaking optimisé, imports directs depuis `utils/functionName/`

### 📋 Règle d'Or

**Barrel files uniquement pour les services de domaine** (organisation en dossiers)  
**Pas de barrel files pour domain/, application/, actions/, hooks/, utils/** (tree-shaking)

### 🎯 Justification

1. **Services de domaine** : Barrel files acceptables car :

   - Chaque service est dans son propre dossier
   - Facilite l'organisation et la découverte
   - Impact tree-shaking minimal (services généralement importés individuellement)

2. **Use Cases, Actions, Hooks, Utils** : Pas de barrel files car :
   - Tree-shaking optimal : imports directs depuis les dossiers spécifiques
   - Réduction de la taille du bundle
   - Imports explicites : on voit exactement ce qu'on importe

### 📝 Exemples

```typescript
// ✅ CORRECT : Import direct (tree-shaking optimal)
import { AutoPlayUseCase } from "./application/AutoPlayUseCase";
import { handlePauseOnAnchor } from "./actions/handlePauseOnAnchor";
import { canPauseOnAnchor } from "./utils/canPauseOnAnchor";

// ✅ CORRECT : Import depuis barrel file du service
import { AutoPlayProgressService } from "./domain/AutoPlayProgressService";

// ❌ INCORRECT : Import depuis barrel file (n'existe pas)
import { AutoPlayUseCase } from "./application"; // N'existe pas
import { handlePauseOnAnchor } from "./actions"; // N'existe pas
```

## Exemple Complet : useAutoPlay

```
useAutoPlay/
├── index.ts                    # Hook principal
├── index.test.ts               # Tests du hook
│
├── application/
│   ├── AutoPlayUseCase/
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── index.ts
│
├── domain/
│   ├── AutoPlayProgressService/
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── AutoPlayPauseService/
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── AutoPlayAnchorDetector/
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── AutoPlayEasingService/
│   │   └── index.ts
│   └── index.ts
│
├── actions/
│   ├── handlePauseOnAnchor/
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── createResumeAfterPauseCallback/
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── clearPauseTimeout/
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── resetPauseState/
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── syncScrollPosition/
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── index.ts
│
├── utils/
│   ├── canPauseOnAnchor/
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── createAutoPlayUseCase/
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── index.ts
│
└── useAutoPlayStateRefs.ts     # Hook helper (peut rester à la racine)
```

## Migration Progressive

1. ✅ **useAutoPlay** : Déjà conforme (modèle de référence)
2. ⏳ **useManualScrollSync** : À refactorer pour être conforme
3. ⏳ **useDynamicZoom** : À refactorer
4. ⏳ **useScrollInitialization** : À refactorer
5. ⏳ **Autres hooks** : À refactorer progressivement

## Bonnes Pratiques

1. **Un fichier = Un test** : Chaque fichier source a son test à côté
2. **Exports centralisés** : Utiliser `index.ts` dans chaque dossier
3. **Imports propres** : Importer depuis les `index.ts` quand possible
4. **Providers partagés** : Utiliser Context pour services partagés entre hooks
5. **Pas de régression** : Tester après chaque refactoring
