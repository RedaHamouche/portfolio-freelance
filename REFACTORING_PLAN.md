# Plan de Refactoring - Option 1 avec Provider

## 🎯 Objectif

Refactoriser l'architecture du système de scroll pour :

- ✅ Architecture claire et lisible
- ✅ Testabilité maximale
- ✅ Performance optimale
- ✅ Aucune régression
- ✅ Clean Architecture avec Provider

## 📐 Structure Cible

```
src/app/MapScroller/
├── contexts/
│   └── ScrollContext.tsx              # Context avec services partagés
│
├── providers/
│   └── ScrollProvider.tsx             # Provider (comme ModalProvider)
│
├── hooks/
│   ├── useManualScrollSync/
│   │   ├── index.ts                   # Hook principal (~50-80 lignes)
│   │   ├── hooks/                     # Sous-hooks React
│   │   │   ├── useScrollEventListeners.ts
│   │   │   ├── useEasingLoop.ts
│   │   │   ├── useScrollInitialization.ts
│   │   │   └── useScrollHandlers.ts
│   │   ├── handlers/                  # Handlers purs, testables
│   │   │   ├── handleUserInteraction.ts
│   │   │   ├── handleScroll.ts
│   │   │   └── processScrollUpdate.ts
│   │   ├── utils/                      # Utilitaires purs (déjà partiellement fait)
│   │   │   ├── isInteractiveElement.ts
│   │   │   ├── shouldReinitializeForPathLength.ts
│   │   │   └── updateScrollDirection.ts
│   │   ├── domain/                     # Services de domaine (existant)
│   │   ├── application/                # Use cases (existant)
│   │   └── useScrollStateRefs.ts       # Refs (existant)
│   │
│   ├── useAutoPlay/
│   │   ├── index.ts                   # Hook principal simplifié
│   │   ├── hooks/
│   │   │   └── useAutoPlayAnimation.ts
│   │   ├── handlers/
│   │   │   └── handleAutoPlayAnimation.ts
│   │   ├── domain/                    # Services (existant)
│   │   ├── application/               # Use cases (existant)
│   │   └── useAutoPlayStateRefs.ts    # Refs (existant)
│   │
│   └── useAutoScrollController/
│       ├── index.ts                   # Hook principal simplifié
│       └── handlers/
│           └── handleAutoScrollAnimation.ts
```

## 📋 Plan d'Implémentation

### Phase 1 : Création du Provider (Base)

1. ✅ Créer `contexts/ScrollContext.tsx`

   - Définir le type `ScrollContextType`
   - Services : easing, progress, velocity, stateDetector
   - Configuration : velocityConfig
   - PathDomain

2. ✅ Créer `providers/ScrollProvider.tsx`

   - Provider React avec services mémoïsés
   - Hook `useScrollContext()`
   - Pattern identique à `ModalProvider`

3. ✅ Intégrer dans l'app
   - Wrapper l'app avec `ScrollProvider`
   - Vérifier que ça fonctionne

### Phase 2 : Extraction des Utilitaires (Déjà partiellement fait)

1. ✅ Extraire `isInteractiveElement` → `utils/isInteractiveElement.ts`
2. ✅ Extraire `shouldReinitializeForPathLength` → `utils/shouldReinitializeForPathLength.ts`
3. ✅ Extraire `updateScrollDirection` → `utils/updateScrollDirection.ts`
4. ✅ Créer les tests unitaires

### Phase 3 : Extraction des Handlers

1. Extraire `handleUserInteraction` → `handlers/handleUserInteraction.ts`

   - Fonction pure, testable
   - Paramètres : event, context, refs, callbacks

2. Extraire `handleScroll` → `handlers/handleScroll.ts`

   - Fonction pure, testable

3. Extraire `processScrollUpdate` → `handlers/processScrollUpdate.ts`

   - Fonction pure, testable

4. Créer les tests unitaires pour chaque handler

### Phase 4 : Création des Sous-Hooks

1. Créer `hooks/useScrollEventListeners.ts`

   - Gère les event listeners (wheel, touch, scroll)
   - Cleanup automatique

2. Créer `hooks/useEasingLoop.ts`

   - Gère la boucle d'easing
   - RAF management

3. Créer `hooks/useScrollInitialization.ts`

   - Gère l'initialisation du useCase
   - Logique de réinitialisation

4. Créer `hooks/useScrollHandlers.ts`
   - Crée les handlers avec le context
   - Retourne handleUserInteraction et handleScroll

### Phase 5 : Refactorisation du Hook Principal

1. Simplifier `useManualScrollSync/index.ts`

   - Utiliser `useScrollContext()`
   - Utiliser les sous-hooks
   - Réduire à ~50-80 lignes
   - Juste orchestration, pas de logique métier

2. Vérifier que tous les tests passent

### Phase 6 : Refactorisation useAutoPlay

1. Extraire `handleAutoPlayAnimation` → `handlers/handleAutoPlayAnimation.ts`
2. Créer `hooks/useAutoPlayAnimation.ts`
3. Simplifier `useAutoPlay/index.ts`
4. Utiliser `useScrollContext()` pour les services partagés

### Phase 7 : Refactorisation useAutoScrollController

1. Extraire `handleAutoScrollAnimation` → `handlers/handleAutoScrollAnimation.ts`
2. Simplifier `useAutoScrollController/index.ts`
3. Utiliser `useScrollContext()` si nécessaire

### Phase 8 : Tests et Validation

1. ✅ Tous les tests unitaires passent
2. ✅ Tous les tests d'intégration passent
3. ✅ Build réussi
4. ✅ Aucune régression fonctionnelle
5. ✅ Performance maintenue ou améliorée

## 🔍 Points d'Attention

### Lisibilité

- Noms de fichiers clairs et explicites
- Structure de dossiers intuitive
- Un fichier = une responsabilité

### Testabilité

- Fonctions pures pour handlers et utils
- Tests unitaires pour chaque fonction
- Tests d'intégration pour les hooks

### Performance

- Services mémoïsés dans le Provider
- Pas de recréation inutile
- RAF optimisé

### Aucune Régression

- Tests existants doivent tous passer
- Comportement identique
- Migration progressive avec vérifications

## 📝 Notes

- Commencer par le Provider pour avoir la base
- Extraire progressivement sans casser
- Tester à chaque étape
- Documenter les changements
