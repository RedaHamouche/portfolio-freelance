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

- Fonctions avec effets de bord (dispatch Redux, setTimeout, window.scrollTo, etc.)
- Modifient l'état ou déclenchent des effets secondaires
- Chaque action dans son propre dossier avec tests
- Exemple : `handlePauseOnAnchor`, `clearPauseTimeout`, `syncScrollPosition`

### `hooks/` - Sous-hooks React

- Hooks React personnalisés pour la composition
- Réutilisables dans d'autres hooks
- Chaque hook dans son propre dossier avec tests
- Exemple : `useEasingLoop`, `useScrollHandlers`

### `utils/` - Utilitaires

- **Fonctions pures uniquement** (sans effets de bord)
- Pas de dispatch Redux, pas de setTimeout, pas de window.scrollTo
- Facilement testables (pas besoin de mocker Redux ou window)
- Exemple : `canPauseOnAnchor`, `createAutoPlayUseCase`

### `providers/` - Providers

- Providers React Context pour partager des services
- Utilisés quand plusieurs hooks partagent les mêmes services
- Exemple : `ScrollContextProvider`

## Conventions de Nommage

- **Fichiers** : `camelCase.ts` ou `PascalCase.tsx` (pour composants)
- **Dossiers** : `camelCase/`
- **Tests** : Toujours `index.test.ts` à côté du fichier source
- **Exports** : Fichier `index.ts` dans chaque dossier pour exports centralisés

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
