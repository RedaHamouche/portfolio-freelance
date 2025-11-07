# Résumé Complet du Système de Scroll

Ce document résume toutes les gestions de scroll implémentées dans l'application, y compris la persistance dans le localStorage.

---

## 📋 Vue d'ensemble

Le système de scroll est organisé en plusieurs hooks et services qui gèrent différents aspects du scroll le long d'un chemin SVG :

1. **Scroll Manuel** : Synchronisation du scroll natif (wheel, touch) avec le progress
2. **Scroll Directionnel** : Scroll contrôlé par clavier/boutons
3. **Autoplay** : Scroll automatique avec pauses aux anchors
4. **Initialisation** : Gestion de l'état initial (hash, localStorage, default)
5. **Persistance** : Sauvegarde automatique du progress dans localStorage
6. **Broker** : Coordination centralisée pour éviter les conflits

---

## 🎯 1. Scroll Manuel (`useManualScrollSync`)

### Objectif

Synchroniser le scroll natif du navigateur (molette, trackpad, gestes tactiles) avec le progress (0-1) le long du chemin SVG.

### Architecture DDD

- **Domain Services** :

  - `ScrollEasingService` : Gère l'inertie et l'easing (courbe d'animation)
  - `ScrollProgressCalculator` : Calcule le progress depuis `window.scrollY`
  - `ScrollStateDetector` : Détecte l'arrêt du scroll
  - `ScrollBroker` : **NOUVEAU** - Coordonne toutes les sources de scroll pour éviter les conflits
  - `UserInteractionDetector` : Détecte les interactions utilisateur (wheel/touch)
  - `AutoplayTransitionService` : Gère la transition fluide entre autoplay et scroll manuel
  - `ScrollInitializationService` : Gère l'état d'initialisation
  - `ScrollVelocityService` : Évite le cumul des vitesses

- **Application Layer** :
  - `ManualScrollSyncUseCase` : Orchestre les services de domaine

### Fonctionnalités

- ✅ Détection des interactions utilisateur (wheel, touchstart, touchmove)
- ✅ Calcul du progress depuis `window.scrollY`
- ✅ Inertie et easing personnalisables (config dans `src/config/index.ts`)
- ✅ Boucle infinie (wraparound 0 ↔ 1)
- ✅ Synchronisation de la direction avec l'autoplay
- ✅ Auto-initialisation si nécessaire (sur iPhone après reload)
- ✅ Gestion des conflits via `ScrollBroker`

### Configuration

```typescript
// src/config/index.ts
SCROLL_INERTIA_FACTOR = 0.06; // Force de l'inertie (plus petit = plus d'inertie)
SCROLL_EASING_TYPE = "easeOut"; // Courbe d'animation
SCROLL_EASING_MIN_DELTA = 0.0001; // Seuil minimum pour arrêter l'animation
```

### Sources de scroll gérées

1. **`user-interaction`** : Wheel, touch (priorité la plus haute)
2. **`scroll-event`** : Événement scroll natif (barre de défilement)
3. **`autoplay`** : Scroll automatique (géré par `useAutoPlay`)
4. **`initialization`** : Initialisation au chargement

---

## 🎮 2. Scroll Directionnel (`useDirectionalScrollHandler`)

### Objectif

Permettre le scroll contrôlé par clavier (flèches) ou boutons UI.

### Fonctionnalités

- ✅ Scroll dans une direction spécifique (haut/bas)
- ✅ Vitesse configurable
- ✅ Intégration avec Redux (`direction` state)

### Utilisation

Contrôlé via le state Redux `scroll.direction` :

- `'haut'` : Scroll vers l'arrière (progress diminue)
- `'bas'` : Scroll vers l'avant (progress augmente)
- `null` : Pas de scroll directionnel

---

## ▶️ 3. Autoplay (`useAutoPlay`)

### Objectif

Faire défiler automatiquement le long du chemin SVG, avec pauses aux points d'intérêt (anchors).

### Architecture DDD

- **Domain Services** :

  - `AutoPlayProgressService` : Calcule le prochain progress avec vitesse et direction
  - `AutoPlayPauseService` : Gère les pauses aux anchors
  - `AutoPlayAnchorDetector` : Détecte les anchors sur le chemin

- **Application Layer** :
  - `AutoPlayUseCase` : Orchestre les services

### Fonctionnalités

- ✅ Vitesse différente mobile/desktop (config dans `AUTO_SCROLL_CONFIG`)
- ✅ Direction configurable (forward/backward)
- ✅ Pauses automatiques aux anchors avec `autoScrollPauseTime`
- ✅ Cooldown de 5 secondes entre pauses sur le même anchor
- ✅ Pause automatique si scroll manuel détecté
- ✅ Reprise automatique après pause

### Configuration

```typescript
// src/config/index.ts
AUTO_SCROLL_CONFIG = {
  mobile: { speed: 0.04 },
  desktop: { speed: 0.1 },
};
```

### États Redux

- `isAutoPlaying` : Autoplay actif/inactif
- `autoScrollDirection` : Direction (1 = forward, -1 = backward)
- `isAutoScrollTemporarilyPaused` : Pause temporaire sur un anchor

---

## 🚀 4. Initialisation (`useScrollInitialization`)

### Objectif

Gérer l'état initial du scroll au chargement de la page, en respectant une priorité.

### Architecture DDD

- **Domain Services** :

  - `ScrollInitializationService` : Gère hash, localStorage, default
  - `ProgressPersistenceService` : Gère la persistance dans localStorage

- **Application Layer** :
  - `ScrollInitializationUseCase` : Orchestre l'initialisation

### Priorité d'initialisation

1. **Hash** (priorité la plus haute) : Si `#anchorId` présent dans l'URL
2. **localStorage** (priorité moyenne) : Si progress sauvegardé
3. **Default** (priorité la plus basse) : Progress = 0.005 (0.5%)

### Fonctionnalités

- ✅ Détection du hash dans l'URL
- ✅ Récupération du progress depuis localStorage
- ✅ Calcul du `scrollY` correspondant
- ✅ `window.scrollTo()` pour positionner le scroll
- ✅ Mise à jour du Redux store

### Retour

- `isScrollSynced` : `true` quand l'initialisation est terminée
- Affiche `<LoadingScreen />` tant que `isScrollSynced === false`

---

## 💾 5. Persistance (`useProgressPersistence`)

### Objectif

Sauvegarder automatiquement le progress dans le localStorage pour le restaurer au prochain chargement.

### Fonctionnement

- ✅ Écoute les changements de `progress` dans Redux
- ✅ Sauvegarde automatiquement dans localStorage (clé : `'scrollProgress'`)
- ✅ Validation : progress doit être entre 0 et 1
- ✅ Gestion des erreurs (quota dépassé, mode privé, etc.)

### Service utilisé

- `ProgressPersistenceService` : Service de domaine pour la persistance
  - `saveProgress(progress)` : Sauvegarde
  - `getProgress()` : Récupération
  - `clearProgress()` : Suppression

### Intégration

- Utilisé par `ScrollInitializationService` pour récupérer le progress sauvegardé
- Priorité : Hash > localStorage > default

---

## 🔄 6. Scroll Broker (`ScrollBroker`)

### Objectif

**NOUVEAU** - Coordonner toutes les sources de scroll pour éviter les conflits et les race conditions.

### Problème résolu

Avant, le scroll fonctionnait "1 fois sur 2" à cause de conflits entre :

- `handleUserInteraction` (wheel/touch)
- `handleScroll` (scroll event)
- `processScrollUpdate` (mise à jour du progress)
- Initialisation multiple

### Fonctionnalités

- ✅ Gestion centralisée de l'état d'initialisation
- ✅ Système de priorité : `user-interaction` > autres sources
- ✅ Protection contre les traitements simultanés (< 16ms)
- ✅ Auto-initialisation si nécessaire
- ✅ Tracking de la source active et du temps

### Méthodes principales

- `canInitialize(globalPathLength)` : Vérifie si l'initialisation est possible
- `markAsInitialized()` : Marque comme initialisé (idempotent)
- `canProcessScroll(source, globalPathLength)` : Vérifie si un scroll peut être traité
- `startProcessing(source)` / `endProcessing()` : Gère l'état de traitement

### Sources gérées

- `'user-interaction'` : Priorité la plus haute
- `'scroll-event'` : Événement scroll natif
- `'autoplay'` : Scroll automatique
- `'initialization'` : Initialisation au chargement

---

## 🎛️ 7. Scroll Manager (`useScrollManager`)

### Objectif

Orchestrer tous les types de scroll en un seul point d'entrée.

### Hooks gérés

1. `useManualScrollSync` : Scroll manuel natif
2. `useDirectionalScrollHandler` : Scroll directionnel
3. `useAutoPlay` : Autoplay

### Retour

```typescript
{
  startDirectionalScroll,
    stopDirectionalScroll,
    startAutoScroll, // alias de startAutoPlay
    stopAutoScroll, // alias de stopAutoPlay
    handleScrollState;
}
```

---

## 📊 8. État Redux (`scrollSlice`)

### Propriétés

```typescript
{
  isScrolling: boolean; // Scroll en cours
  scrollingSpeed: number; // Vitesse du scroll directionnel
  direction: "haut" | "bas" | null; // Direction du scroll directionnel
  isAutoPlaying: boolean; // Autoplay actif/inactif
  progress: number; // Progress actuel (0-1)
  pathLength: number; // Longueur du path SVG
  autoScrollDirection: 1 | -1; // Direction de l'autoplay
  isAutoScrollTemporarilyPaused: boolean; // Pause temporaire sur anchor
  lastScrollDirection: "forward" | "backward" | null; // Dernière direction scrollée
}
```

### Actions

- `setProgress(progress)`
- `setIsScrolling(isScrolling)`
- `setAutoPlaying(isAutoPlaying)`
- `setAutoScrollDirection(direction)`
- `setLastScrollDirection(direction)`
- `setPathLength(length)`
- etc.

---

## 🔄 9. Flux d'initialisation complet

### Au chargement de la page

1. **`MapScroller`** se monte
2. **`useScrollInitialization`** :

   - Attend que `globalPathLength` soit disponible
   - Vérifie le hash dans l'URL
   - Si hash présent → utilise le progress du hash
   - Sinon, vérifie localStorage
   - Si localStorage présent → utilise le progress sauvegardé
   - Sinon → utilise progress = 0.005 (default)
   - Calcule `scrollY` et fait `window.scrollTo()`
   - Met à jour Redux
   - Retourne `isScrollSynced = true`

3. **`useProgressPersistence`** :

   - Écoute les changements de `progress`
   - Sauvegarde automatiquement dans localStorage

4. **`useScrollManager`** :

   - Initialise `useManualScrollSync`
   - Initialise `useDirectionalScrollHandler`
   - Initialise `useAutoPlay`

5. **`useManualScrollSync`** :
   - Attache les event listeners (wheel, touch, scroll)
   - Attend que `isScrollSynced === true`
   - Utilise `ScrollBroker` pour gérer l'initialisation
   - Si interaction utilisateur avant `isScrollSynced` → auto-initialise

---

## 🎯 10. Gestion des conflits (ScrollBroker)

### Problème

Plusieurs sources peuvent déclencher un scroll simultanément :

- User scroll (wheel/touch)
- Scroll event (barre de défilement)
- Autoplay
- Initialisation

### Solution : ScrollBroker

Le broker :

1. **Gère l'état d'initialisation** de manière unique
2. **Coordonne les sources** avec un système de priorité
3. **Évite les conflits** en bloquant les traitements simultanés (< 16ms)
4. **Auto-initialise** si nécessaire

### Priorité

1. `user-interaction` : Toujours prioritaire
2. `scroll-event` : Si pas de traitement en cours
3. `autoplay` : Si pas de traitement en cours
4. `initialization` : Si pas encore initialisé

### Protection

- Si un traitement est en cours depuis moins de 16ms (1 frame), les autres sources sont ignorées
- Sauf `user-interaction` qui a toujours la priorité

---

## 📝 11. Configuration complète

### Fichier : `src/config/index.ts`

```typescript
// Scroll Configuration
SCROLL_CONFIG = {
  SCROLL_PER_PX: 1.5, // Multiplicateur pour convertir pathLength en pixels
  ANCHOR_TOLERANCE: 0.002, // Tolérance pour détecter les anchors
  SCROLL_END_DELAY: 150, // Délai pour détecter la fin du scroll (ms)
  FRAME_DELAY: 16, // Délai approximatif entre frames (ms)
  ANCHOR_BUMP: 0.004, // Bump pour sortir de la zone d'anchor
  SCROLL_MARGINS: { TOP: 20, BOTTOM: 20 },
};

// Inertie & Easing
SCROLL_INERTIA_FACTOR = 0.06; // Force de l'inertie
SCROLL_EASING_TYPE = "easeOut"; // Courbe d'animation
SCROLL_EASING_MIN_DELTA = 0.0001; // Seuil minimum pour arrêter

// Autoplay
AUTO_SCROLL_CONFIG = {
  mobile: { speed: 0.04 },
  desktop: { speed: 0.1 },
};
```

---

## 🔍 12. Points d'attention

### iPhone / Safari iOS

- ✅ Auto-initialisation si interaction avant `isScrollSynced`
- ✅ Gestion de la barre Safari (dimensions stables)
- ✅ Double RAF pour stabiliser `window.scrollY`
- ✅ Pas de `clipPath` (bug Safari iOS)

### Performance

- ✅ Mémoïsation des services et use cases
- ✅ RAF pour limiter les calculs
- ✅ Protection contre les traitements simultanés
- ✅ Validation du progress avant sauvegarde

### Robustesse

- ✅ Gestion des erreurs localStorage
- ✅ Validation des valeurs (progress 0-1)
- ✅ Protection contre les conflits (ScrollBroker)
- ✅ Réinitialisation si pathLength change

---

## 📚 13. Documentation complémentaire

- **Use Cases Gherkin** : `docs/SCROLL_USE_CASES.md`
- **Autoplay** : `docs/AUTOPLAY.md`
- **Tests d'intégration** : `src/app/MapScroller/hooks/useManualScrollSync/index.integration.test.tsx`

---

## 🎯 Résumé en une phrase

Le système de scroll synchronise le scroll natif du navigateur avec un progress (0-1) le long d'un chemin SVG, avec support de l'autoplay, de la persistance localStorage, et d'une coordination centralisée via ScrollBroker pour éviter les conflits.
