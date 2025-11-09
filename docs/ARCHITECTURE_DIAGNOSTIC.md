# Diagnostic d'Architecture - Portfolio Freelance

**Date** : Analyse complète de l'architecture actuelle  
**Objectif** : Identifier les points forts, faiblesses, incohérences et opportunités d'amélioration

---

## 📊 Vue d'Ensemble

### Structure Globale

```
src/
├── app/                    # Next.js App Router (routes)
│   ├── layout.tsx         # Layout principal avec providers
│   └── page.tsx           # Page d'accueil
│
├── components/
│   ├── app/               # Composants applicatifs
│   │   ├── Cursor/        # Curseur personnalisé
│   │   ├── Header/        # En-tête
│   │   └── MapScroller/   # Système de navigation principal
│   ├── commons/           # Composants réutilisables
│   │   └── Image/         # Composant image générique
│   └── templatingComponents/  # Composants du système de templating
│       ├── page/          # Composants de page
│       ├── path/          # Composants de path
│       └── pathTangente/   # Composants de pathTangente
│
├── contexts/              # React Contexts (providers)
│   ├── CursorContext/
│   ├── ModalContext/
│   ├── ReduxContext/
│   └── ScrollContext/
│
├── hooks/                 # Hooks réutilisables (non spécifiques à MapScroller)
│   ├── useBreakpointValue/
│   ├── useClickableElements/
│   ├── useFocusTrap/
│   ├── useOnClickOutside/
│   ├── useProgressAnimation/
│   ├── useRafLoop/
│   └── useResponsivePath/
│
├── store/                 # Redux store
│   ├── cursorSlice/
│   ├── mapSlice/
│   ├── modalSlice/
│   └── scrollSlice/
│
├── templating/            # Système de templating (DDD)
│   ├── components/        # Composants dynamiques (Page, Path, PathTangente)
│   ├── config/           # Configuration JSON (desktop/mobile)
│   ├── domains/           # Domaines métier (page, path, tangente)
│   └── mappingComponent.ts  # Mapping des composants
│
├── utils/                 # Utilitaires partagés
│   ├── domUtils/
│   ├── pathCalculations/
│   ├── pathPositionCache/
│   ├── scrollCalculations/
│   ├── scrollUtils/
│   ├── ssr/
│   ├── tangentCalculations/
│   ├── tangentUtils/
│   ├── validation/
│   └── viewportCalculations/
│
└── config/                # Configuration centralisée
    ├── desktop.ts
    ├── index.ts
    └── mobile.ts
```

---

## ✅ Points Forts

### 1. Architecture DDD Bien Structurée

**✅ Points positifs** :

- **Séparation claire** : Domain / Application / Actions / Utils
- **Services de domaine purs** : Pas de dépendances React/Redux
- **Use Cases bien définis** : Orchestration métier claire
- **Actions isolées** : Effets de bord séparés

**Exemples** :

- `useAutoPlay` : Modèle de référence DDD complet
- `MapViewport` : Architecture DDD bien appliquée
- `templating/domains` : Domaines métier bien structurés

### 2. Système de Templating Cohérent

**✅ Points positifs** :

- **Domaines séparés** : `page`, `path`, `pathTangente`
- **Repositories** : Chargement JSON centralisé
- **APIs claires** : Interfaces bien définies
- **Configuration responsive** : Desktop/Mobile séparés

### 3. Utilitaires Centralisés

**✅ Points positifs** :

- **Single Source of Truth** : `syncScrollPosition`, `calculateScrollY`, `ProgressUpdateService`
- **Validation centralisée** : `isValidProgress`, `isValidPathLength`, `isValidScrollY`
- **SSR safety** : `isBrowser()` centralisé
- **Organisation logique** : Par domaine (scroll, path, viewport, validation)

### 4. Performance Optimisée

**✅ Points positifs** :

- **Cache LRU** : `pathPositionCache` pour les positions
- **Recherche binaire** : O(log n) au lieu de O(n)
- **Indexation O(1)** : Maps pour les recherches par ID
- **Memoization** : `useMemo`, `useCallback` bien utilisés
- **GSAP optimisé** : `quickTo` pour les animations

### 5. Tests Co-localisés

**✅ Points positifs** :

- **Tests à côté des sources** : `index.test.ts` à côté de `index.ts`
- **Couverture importante** : Services de domaine bien testés
- **TDD appliqué** : Tests Gherkin pour les use cases

### 6. Documentation Complète

**✅ Points positifs** :

- **Documentation technique** : `docs/ARCHITECTURE.md`, `docs/SCROLL_SYSTEM_SUMMARY.md`
- **Analyse des doublons** : `docs/DOUBLONS_ANALYSIS.md`
- **Optimisations documentées** : `docs/OPTIMIZATIONS_IMPLEMENTED.md`

---

## ⚠️ Points Faibles et Incohérences

### 1. Incohérence dans la Structure des Hooks

**🔴 Problème critique** :

Les hooks ne suivent pas tous la même structure DDD :

#### ✅ Hooks Conformes (Modèle de référence)

- **`useAutoPlay`** : Structure DDD complète
  - ✅ `domain/` avec services
  - ✅ `application/` avec use case
  - ✅ `actions/` avec effets de bord
  - ✅ `utils/` avec fonctions pures
  - ✅ `hooks/` avec sous-hooks React

#### ⚠️ Hooks Partiellement Conformes

- **`useManualScrollSync`** : Structure DDD mais incohérente

  - ✅ `domain/` avec services
  - ✅ `application/` avec use case (mais à la racine, pas dans `application/`)
  - ✅ `actions/` avec effets de bord
  - ✅ `hooks/` avec sous-hooks React
  - ⚠️ `ManualScrollSyncUseCase.ts` à la racine au lieu de `application/ManualScrollSyncUseCase/`
  - ⚠️ `useScrollStateRefs.ts` à la racine (devrait être dans `hooks/` ou `utils/`)

- **`useScrollInitialization`** : Structure DDD mais incomplète

  - ✅ `domain/` avec services
  - ✅ `application/` avec use case
  - ⚠️ Pas de `actions/` (logique dans le hook principal)
  - ⚠️ Pas de `hooks/` (logique dans le hook principal)
  - ⚠️ Pas de `utils/` (logique dans le hook principal)

- **`useDynamicZoom`** : Structure DDD partielle

  - ✅ `domain/` avec services
  - ✅ `application/` avec use case (mais à la racine)
  - ⚠️ `DynamicZoomUseCase.ts` à la racine au lieu de `application/DynamicZoomUseCase/`
  - ⚠️ Pas de `actions/` (logique dans le hook principal)
  - ⚠️ Pas de `hooks/` (logique dans le hook principal)
  - ⚠️ `utils/createDynamicZoomUseCase/` existe mais pas utilisé

- **`useDirectionalScrollHandler`** : Structure DDD partielle
  - ✅ `domain/` (implicite dans le use case)
  - ✅ `application/` avec use case (mais à la racine)
  - ✅ `actions/` avec effets de bord
  - ⚠️ `DirectionalScrollUseCase.ts` à la racine au lieu de `application/DirectionalScrollUseCase/`
  - ⚠️ `useDirectionalScrollStateRefs.ts` à la racine

#### ❌ Hooks Non Conformes

- **`useAutoScrollController`** : Pas de structure DDD

  - ❌ Pas de `domain/`
  - ❌ Pas de `application/`
  - ❌ Pas de `actions/`
  - ❌ Logique métier dans le hook principal

- **`usePathCalculations`** : Pas de structure DDD

  - ❌ Pas de `domain/`
  - ❌ Pas de `application/`
  - ❌ Logique métier dans le hook principal

- **`useProgressPersistence`** : Pas de structure DDD

  - ❌ Pas de `domain/`
  - ❌ Utilise `ProgressPersistenceService` depuis `useScrollInitialization/domain/` (dépendance croisée)

- **`useScrollManager`** : Orchestrateur simple (acceptable)

### 2. Duplication de Domaines

**🟠 Problème moyen** :

Les domaines templating sont créés plusieurs fois :

- **`ScrollContext`** : Crée `pathDomain` une fois (✅)
- **`usePathCalculations`** : Crée `pathDomain` avec `useMemo` (⚠️ duplication)
- **`templating/components/page`** : Crée `pageDomain` avec `useMemo` (⚠️ duplication)
- **`templating/components/path`** : Crée `pathDomain` avec `useMemo` (⚠️ duplication)
- **`templating/components/pathTangente`** : Crée `tangenteDomain` avec `useMemo` (⚠️ duplication)

**Impact** :

- Plusieurs instances des mêmes domaines
- Cache dupliqué (chaque instance a son propre cache)
- Performance sous-optimale

**Solution recommandée** : Utiliser les domaines depuis `ScrollContext` ou créer un `TemplatingContext`

### 3. Incohérence dans les Use Cases

**🟠 Problème moyen** :

- **`useAutoPlay`** : `AutoPlayUseCase` dans `application/AutoPlayUseCase/` ✅
- **`useManualScrollSync`** : `ManualScrollSyncUseCase.ts` à la racine ❌
- **`useDynamicZoom`** : `DynamicZoomUseCase.ts` à la racine ❌
- **`useDirectionalScrollHandler`** : `DirectionalScrollUseCase.ts` à la racine ❌
- **`useScrollInitialization`** : `ScrollInitializationUseCase` dans `application/ScrollInitializationUseCase/` ✅
- **`MapViewport`** : `MapViewportUseCase` dans `application/MapViewportUseCase/` ✅

**Impact** : Incohérence dans la structure, difficulté à trouver les use cases

### 4. Services Partagés vs Services Locaux

**🟠 Problème moyen** :

- **`ProgressUpdateService`** : Dans `MapScroller/services/` (✅ bien placé)
- **Services de scroll** : Dans `ScrollContext` (✅ bien placé)
- **Services de viewport** : Dans `MapViewport/domain/` (✅ bien placé)
- **Services de templating** : Créés localement dans chaque composant (⚠️ duplication)

**Impact** : Services dupliqués, pas de source unique de vérité pour les domaines templating

### 5. Actions vs Utils - Confusion

**🟡 Problème faible** :

- **`useManualScrollSync/utils/updateScrollDirection/`** : Utilise `ProgressUpdateService` (effet de bord) → Devrait être dans `actions/`
- **`useManualScrollSync/actions/updateScrollDirection/`** : Existe aussi (duplication ?)

**Impact** : Confusion entre actions et utils, risque de duplication

### 6. Hooks vs Actions - Confusion

**🟡 Problème faible** :

- **`useManualScrollSync/hooks/useEasingLoop.ts`** : Gère la boucle d'easing (logique métier)
- **`useManualScrollSync/actions/startEasingLoop/`** : Dossier existe mais vide

**Impact** : Confusion sur où mettre la logique d'easing

### 7. Imports Relatifs vs Absolus

**🟡 Problème faible** :

- **Majorité** : Utilise `@/` (✅)
- **Quelques cas** : Imports relatifs `../../` dans `MapScroller` (⚠️)

**Exemples** :

- `src/components/app/MapScroller/hooks/useManualScrollSync/actions/processScrollUpdate/index.ts` : `../../../../services/ProgressUpdateService`

**Impact** : Fragilité lors des déplacements de fichiers

### 8. ReduxContext - Utilité Questionnable

**🟡 Problème faible** :

- **`ReduxContext`** : Simple wrapper autour de `<Provider store={store}>`
- **Autres contexts** : Logique métier (ModalContext, ScrollContext, CursorContext)

**Impact** : Incohérence avec les autres contexts, mais acceptable pour la cohérence

### 9. Tests Manquants

**🟡 Problème faible** :

- **Hooks principaux** : Tests présents ✅
- **Services de domaine** : Tests présents ✅
- **Actions** : Tests présents pour `useAutoPlay` ✅
- **Actions** : Tests manquants pour `useManualScrollSync` ⚠️
- **Composants** : Tests manquants pour la plupart ⚠️

### 10. Barrel Files (Index.ts)

**🟡 Problème faible** :

- **Domain services** : Chaque service a son `index.ts` ✅ (demandé par l'utilisateur)
- **Hooks** : `hooks/index.ts` existe ✅
- **Components** : `components/index.ts` existe ✅
- **Domain/Application/Actions** : Pas de barrel files (✅ pour tree-shaking, mais incohérent avec les services)

**Impact** : Incohérence dans l'utilisation des barrel files

---

## 🔍 Analyse Détaillée par Module

### Module : MapScroller

#### Points Forts ✅

- **Architecture DDD** : Bien structurée avec domain/application/actions
- **Services centralisés** : `ProgressUpdateService` bien placé
- **Context partagé** : `ScrollContext` centralise les services
- **Hooks bien organisés** : Structure claire

#### Points Faibles ⚠️

- **Incohérence des hooks** : Tous ne suivent pas la même structure
- **Use cases à la racine** : `ManualScrollSyncUseCase.ts`, `DynamicZoomUseCase.ts`, `DirectionalScrollUseCase.ts`
- **State refs à la racine** : `useScrollStateRefs.ts`, `useAutoPlayStateRefs.ts`, `useDirectionalScrollStateRefs.ts`

### Module : Templating

#### Points Forts ✅

- **Domaines bien séparés** : `page`, `path`, `tangente`
- **Repositories** : Chargement JSON centralisé
- **APIs claires** : Interfaces bien définies
- **Configuration responsive** : Desktop/Mobile séparés

#### Points Faibles ⚠️

- **Duplication des domaines** : Créés plusieurs fois dans différents composants
- **Pas de context partagé** : Chaque composant crée son propre domaine
- **Cache dupliqué** : Chaque instance a son propre cache

### Module : Utils

#### Points Forts ✅

- **Organisation logique** : Par domaine (scroll, path, viewport, validation)
- **Single Source of Truth** : Fonctions centralisées
- **Tests présents** : La plupart des utils sont testés

#### Points Faibles ⚠️

- **Dossier `domUtils/isInteractiveElement/`** : Vide (probablement supprimé mais dossier reste)
- **Quelques duplications** : `isInteractiveElement` peut-être dupliqué

### Module : Contexts

#### Points Forts ✅

- **Structure cohérente** : Tous dans `contexts/` avec `index.tsx`
- **Logique métier** : ModalContext, ScrollContext, CursorContext ont de la logique
- **Pattern Provider** : Cohérent avec `NomProvider` pour les composants

#### Points Faibles ⚠️

- **ReduxContext** : Simple wrapper (utilité questionnable mais acceptable pour cohérence)

---

## 🎯 Recommandations par Priorité

### 🔴 PRIORITÉ 1 : Incohérence des Hooks

**Problème** : Les hooks ne suivent pas tous la même structure DDD

**Actions** :

1. **Déplacer les Use Cases à la racine** :

   - `useManualScrollSync/ManualScrollSyncUseCase.ts` → `useManualScrollSync/application/ManualScrollSyncUseCase/index.ts`
   - `useDynamicZoom/DynamicZoomUseCase.ts` → `useDynamicZoom/application/DynamicZoomUseCase/index.ts`
   - `useDirectionalScrollHandler/DirectionalScrollUseCase.ts` → `useDirectionalScrollHandler/application/DirectionalScrollUseCase/index.ts`

2. **Déplacer les State Refs** :

   - `useScrollStateRefs.ts` → `useManualScrollSync/hooks/useScrollStateRefs/index.ts`
   - `useAutoPlayStateRefs.ts` → `useAutoPlay/hooks/useAutoPlayStateRefs/index.ts`
   - `useDirectionalScrollStateRefs.ts` → `useDirectionalScrollHandler/hooks/useDirectionalScrollStateRefs/index.ts`

3. **Refactorer les hooks simples** :
   - `useAutoScrollController` : Ajouter structure DDD
   - `usePathCalculations` : Ajouter structure DDD
   - `useProgressPersistence` : Utiliser service depuis context ou créer structure DDD

### 🟠 PRIORITÉ 2 : Duplication des Domaines Templating

**Problème** : Les domaines templating sont créés plusieurs fois

**Actions** :

1. **Créer un `TemplatingContext`** :

   - Centraliser `pageDomain`, `pathDomain`, `tangenteDomain`
   - Partager entre tous les composants qui en ont besoin

2. **Utiliser depuis le context** :
   - `templating/components/page` : Utiliser depuis context
   - `templating/components/path` : Utiliser depuis context
   - `templating/components/pathTangente` : Utiliser depuis context
   - `usePathCalculations` : Utiliser depuis context

### 🟠 PRIORITÉ 3 : Actions vs Utils - Clarification

**Problème** : Confusion entre actions et utils

**Actions** :

1. **Auditer les utils** :

   - Vérifier qu'ils n'ont pas d'effets de bord
   - Déplacer vers `actions/` si nécessaire

2. **Clarifier les actions** :
   - Vérifier qu'elles ont bien des effets de bord
   - Documenter la différence

### 🟡 PRIORITÉ 4 : Imports Relatifs

**Problème** : Quelques imports relatifs dans MapScroller

**Actions** :

1. **Remplacer par des imports absolus** :
   - `../../../../services/ProgressUpdateService` → `@/components/app/MapScroller/services/ProgressUpdateService`

### 🟡 PRIORITÉ 5 : Tests Manquants

**Problème** : Certains hooks/actions n'ont pas de tests

**Actions** :

1. **Ajouter des tests** :
   - `useManualScrollSync/actions/` : Ajouter tests manquants
   - Composants : Ajouter tests pour les composants critiques

### 🟡 PRIORITÉ 6 : Barrel Files

**Problème** : Incohérence dans l'utilisation des barrel files

**Actions** :

1. **Décider d'une stratégie** :
   - Soit tout avec barrel files (pour cohérence)
   - Soit tout sans barrel files (pour tree-shaking)
   - Documenter la décision

---

## 📈 Métriques

### Complexité des Hooks

| Hook                          | Lignes | Structure DDD       | Tests | Conformité |
| ----------------------------- | ------ | ------------------- | ----- | ---------- |
| `useAutoPlay`                 | ~255   | ✅ Complète         | ✅    | 100%       |
| `useManualScrollSync`         | ~188   | ⚠️ Partielle        | ⚠️    | 70%        |
| `useScrollInitialization`     | ~96    | ⚠️ Partielle        | ✅    | 60%        |
| `useDynamicZoom`              | ~50    | ⚠️ Partielle        | ✅    | 50%        |
| `useDirectionalScrollHandler` | ~80    | ⚠️ Partielle        | ✅    | 60%        |
| `useAutoScrollController`     | ~50    | ❌ Aucune           | ✅    | 30%        |
| `usePathCalculations`         | ~52    | ❌ Aucune           | ✅    | 20%        |
| `useProgressPersistence`      | ~30    | ❌ Aucune           | ❌    | 10%        |
| `useScrollManager`            | ~49    | N/A (orchestrateur) | ❌    | N/A        |

### Couverture des Tests

- **Services de domaine** : ~90% ✅
- **Use Cases** : ~80% ✅
- **Actions** : ~60% ⚠️
- **Hooks principaux** : ~70% ⚠️
- **Composants** : ~10% ❌

### Duplications Identifiées

- **Domaines templating** : 5 instances (devrait être 1)
- **Services de scroll** : 1 instance (✅ via ScrollContext)
- **Services de viewport** : 1 instance (✅ dans MapViewport)

---

## 🎯 Plan d'Action Recommandé

### Phase 1 : Harmonisation des Hooks (Priorité 🔴)

1. **Déplacer les Use Cases** :

   - `ManualScrollSyncUseCase` → `application/ManualScrollSyncUseCase/`
   - `DynamicZoomUseCase` → `application/DynamicZoomUseCase/`
   - `DirectionalScrollUseCase` → `application/DirectionalScrollUseCase/`

2. **Déplacer les State Refs** :

   - Tous dans `hooks/` ou `utils/` selon leur nature

3. **Refactorer les hooks simples** :
   - Ajouter structure DDD minimale

### Phase 2 : Centralisation des Domaines (Priorité 🟠)

1. **Créer `TemplatingContext`** :

   - Centraliser `pageDomain`, `pathDomain`, `tangenteDomain`
   - Partager via context

2. **Migrer les composants** :
   - Utiliser depuis context au lieu de créer localement

### Phase 3 : Clarification Actions/Utils (Priorité 🟠)

1. **Audit complet** :

   - Identifier toutes les fonctions avec effets de bord
   - Déplacer vers `actions/` si nécessaire

2. **Documenter** :
   - Clarifier la différence entre actions et utils

### Phase 4 : Nettoyage (Priorité 🟡)

1. **Imports absolus** :

   - Remplacer tous les imports relatifs

2. **Tests manquants** :

   - Ajouter tests pour actions et composants

3. **Barrel files** :
   - Décider d'une stratégie et l'appliquer

---

## 📝 Conclusion

### Points Forts Majeurs ✅

1. **Architecture DDD bien appliquée** dans `useAutoPlay` et `MapViewport`
2. **Utilitaires centralisés** : Single Source of Truth
3. **Performance optimisée** : Cache, recherche binaire, indexation
4. **Documentation complète** : Guides et analyses détaillées

### Points à Améliorer ⚠️

1. **Incohérence des hooks** : Tous ne suivent pas la même structure
2. **Duplication des domaines** : Créés plusieurs fois
3. **Use cases à la racine** : Devraient être dans `application/`
4. **Tests incomplets** : Certains hooks/actions manquent de tests

### Score Global : 7.5/10

**Justification** :

- ✅ Architecture solide avec DDD bien appliqué
- ✅ Performance optimisée
- ✅ Documentation complète
- ⚠️ Incohérences structurelles à corriger
- ⚠️ Duplications à éliminer

---

## 🚀 Prochaines Étapes

1. **Valider ce diagnostic** avec l'équipe
2. **Prioriser les actions** selon les besoins
3. **Créer des tickets** pour chaque phase
4. **Implémenter progressivement** sans régression
