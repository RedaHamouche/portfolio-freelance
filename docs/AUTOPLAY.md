# Documentation : Fonctionnalité Autoplay

## Vue d'ensemble

La fonctionnalité **Autoplay** permet de faire défiler automatiquement le contenu le long du path SVG. Elle est implémentée avec une architecture **DDD (Domain-Driven Design)** et **TDD (Test-Driven Development)**, garantissant une séparation claire des responsabilités et une maintenabilité optimale.

## Architecture

### Structure DDD

```
useAutoPlay/
├── domain/                          # Services de domaine (logique métier pure)
│   ├── AutoPlayProgressService.ts   # Calcul du prochain progress
│   ├── AutoPlayPauseService.ts      # Gestion des pauses avec autoScrollPauseTime
│   └── AutoPlayAnchorDetector.ts    # Détection des anchors sur le path
├── application/                     # Use case (orchestration)
│   └── AutoPlayUseCase.ts           # Coordonne les services de domaine
└── index.ts                         # Hook React (infrastructure)
```

### Séparation des responsabilités

- **Domain** : Logique métier pure, testable indépendamment
- **Application** : Orchestration des services de domaine
- **Infrastructure** : Intégration React/Redux, gestion des effets de bord

## Fonctionnement

### 1. Démarrage de l'autoplay

**Trigger** : `isAutoPlaying` passe de `false` à `true` (via Redux)

**Processus** :

1. `startAutoPlay()` est appelé
2. Réinitialisation des états de pause (`isPausedRef`, `lastPausedAnchorIdRef`)
3. Démarrage de la boucle d'animation via `useRafLoop`
4. La fonction `animate()` est appelée à chaque frame (~60fps)

### 2. Calcul du progress

À chaque frame, `AutoPlayProgressService` calcule le nouveau progress :

```typescript
newProgress = (currentProgress + direction * AUTO_SCROLL_SPEED * dt + 1) % 1;
```

- `direction` : `1` (forward) ou `-1` (backward)
- `AUTO_SCROLL_SPEED` : Vitesse configurable (défaut: `0.15`)
- `dt` : Delta time en secondes (~0.016s pour 60fps)
- Le modulo `% 1` gère le wraparound circulaire (0-1)

### 3. Détection des anchors et pauses

**Processus** :

1. `AutoPlayAnchorDetector` détecte si un anchor est présent entre `currentProgress` et `newProgress`
2. `AutoPlayPauseService` vérifie si une pause est nécessaire :
   - Si `autoScrollPauseTime` n'est **pas défini** → pause de **1s par défaut**
   - Si `autoScrollPauseTime > 0` → pause avec la durée spécifiée
   - Si `autoScrollPauseTime = 0` ou négatif → pas de pause
3. Si pause nécessaire :
   - L'autoplay s'arrête temporairement
   - Un `setTimeout` est programmé avec la durée de pause
   - Après la pause, un "bump" est appliqué pour sortir de la zone de l'anchor
   - L'autoplay reprend automatiquement

**Important** : Un anchor ne déclenche qu'une seule pause (tracking via `lastPausedAnchorIdRef`)

### 4. Synchronisation avec window.scrollY

À chaque frame, après le calcul du progress :

1. Calcul de `targetScrollY` depuis le nouveau progress
2. Appel de `window.scrollTo({ top: targetScrollY, behavior: 'auto' })`
3. Activation temporaire de `programmaticScrollFlag` pour éviter que `useManualScrollSync` détecte ce scroll comme manuel

### 5. Arrêt de l'autoplay

**Triggers possibles** :

- Clic sur le bouton "Pause"
- Scroll manuel détecté (via événements `wheel`/`touch`)
- Modal ouverte

**Processus** :

1. `stopAutoPlay()` est appelé
2. Arrêt de la boucle d'animation
3. Nettoyage des timeouts en cours
4. Réinitialisation de `programmaticScrollFlag`

## Cas d'usage détaillés

### Cas 1 : Démarrage simple

**Scénario** : L'utilisateur clique sur "Play"

**Comportement** :

1. `isAutoPlaying` passe à `true`
2. L'autoplay démarre dans la direction actuelle (`autoScrollDirection`)
3. Le scroll commence automatiquement
4. Le PointTrail affiche la direction correspondante

**État Redux** :

- `isAutoPlaying: true`
- `isScrolling: true`
- `lastScrollDirection: 'forward' | 'backward'` (selon `autoScrollDirection`)

### Cas 2 : Pause sur un anchor

**Scénario** : L'autoplay atteint un composant avec `autoScrollPauseTime`

**Comportement** :

1. Détection de l'anchor entre `currentProgress` et `newProgress`
2. Vérification que `autoScrollPauseTime > 0` ou non défini
3. Pause de l'autoplay (mais `isAutoPlaying` reste `true`)
4. Affichage de l'état "pause temporaire" (bouton orange)
5. Après la durée de pause :
   - Application d'un "bump" pour sortir de la zone de l'anchor
   - Reprise automatique de l'autoplay

**État Redux** :

- `isAutoPlaying: true`
- `isAutoScrollTemporarilyPaused: true` (pendant la pause)
- `isAutoScrollTemporarilyPaused: false` (après la pause)

**Configuration** :

```json
{
  "anchorId": "myComponent",
  "autoScrollPauseTime": 2000 // 2 secondes
}
```

Si `autoScrollPauseTime` n'est pas défini, pause de **1 seconde par défaut**.

### Cas 3 : Scroll manuel pendant l'autoplay

**Scénario** : L'utilisateur scroll manuellement alors que l'autoplay est actif

**Détection** :

- Écoute des événements `wheel` (souris/trackpad) et `touchstart`/`touchmove` (mobile)
- Ces événements sont **uniquement** déclenchés par l'utilisateur, pas par `window.scrollTo()`

**Comportement** :

1. Détection immédiate de l'interaction utilisateur
2. Mise en pause automatique de l'autoplay (`isAutoPlaying: false`)
3. Synchronisation de la direction :
   - `lastScrollDirection` est mis à jour selon le scroll
   - `autoScrollDirection` est synchronisé pour correspondre
4. L'utilisateur reprend le contrôle complet

**Important** : L'événement `scroll` n'est **pas** utilisé pour détecter les scrolls manuels car il est aussi déclenché par `window.scrollTo()` de l'autoplay.

### Cas 4 : Changement de direction

**Scénario A** : Changement via le bouton direction

**Comportement** :

1. `autoScrollDirection` est inversé (1 ↔ -1)
2. `lastScrollDirection` est mis à jour pour correspondre
3. Le PointTrail affiche immédiatement la nouvelle direction
4. Si l'autoplay est actif, il continue dans la nouvelle direction

**Scénario B** : Scroll manuel change la direction

**Comportement** :

1. `lastScrollDirection` est mis à jour selon le scroll
2. `autoScrollDirection` est automatiquement synchronisé
3. Si on relance l'autoplay, il continue dans la direction du dernier scroll

### Cas 5 : Arrêt et redémarrage

**Scénario** : L'utilisateur clique sur "Pause" puis "Play"

**Comportement** :

1. À l'arrêt :

   - La boucle d'animation s'arrête
   - Les timeouts sont nettoyés
   - `isAutoPlaying: false`

2. Au redémarrage :
   - Réinitialisation des états de pause
   - Synchronisation avec `window.scrollY` actuel (via `useManualScrollSync`)
   - Reprise dans la direction actuelle (`autoScrollDirection`)

**Important** : Le progress est synchronisé avec `window.scrollY` à l'arrêt pour éviter que le PointTrail "téléporte" lors du scroll manuel suivant.

### Cas 6 : Modal ouverte

**Scénario** : Une modal s'ouvre pendant l'autoplay

**Comportement** :

1. L'autoplay s'arrête automatiquement (vérification de `isModalOpen` dans `animate()`)
2. Aucune animation n'est exécutée
3. L'état `isAutoPlaying` reste `true` (l'autoplay reprendra si la modal se ferme)

## Synchronisation bidirectionnelle

### Direction : Autoplay → PointTrail

Quand l'autoplay est actif :

- `lastScrollDirection` est mis à jour selon `autoScrollDirection`
- Le PointTrail affiche la direction correspondante

### Direction : Scroll manuel → Autoplay

Quand l'utilisateur scroll manuellement :

- `lastScrollDirection` est mis à jour selon le scroll
- `autoScrollDirection` est automatiquement synchronisé
- Si on relance l'autoplay, il continue dans la direction du dernier scroll

**Résultat** : Les deux systèmes restent toujours synchronisés, peu importe l'origine du changement de direction.

## Configuration

### Vitesse de scroll

**Fichier** : `src/config/index.ts`

```typescript
export const AUTO_SCROLL_SPEED = 0.15; // Modifiable
```

- Plus la valeur est élevée, plus le scroll est rapide
- Valeur recommandée : `0.10` à `0.20`

### Durée de pause par défaut

**Fichier** : `src/app/MapScroller/hooks/useAutoPlay/domain/AutoPlayPauseService.ts`

```typescript
private readonly DEFAULT_PAUSE_TIME = 1000; // 1 seconde
```

### Configuration des anchors

**Fichier** : `src/templating/config/mobile/pathComponents.json` ou `desktop/pathComponents.json`

```json
{
  "anchorId": "myComponent",
  "autoScrollPauseTime": 2000 // En millisecondes
}
```

- Si `autoScrollPauseTime` n'est pas défini → pause de 1s par défaut
- Si `autoScrollPauseTime = 0` → pas de pause
- Si `autoScrollPauseTime < 0` → pas de pause

## Détection des scrolls manuels vs programmatiques

### Problème initial

Quand l'autoplay appelle `window.scrollTo()`, cela déclenche l'événement `scroll`, qui était aussi utilisé pour détecter les scrolls manuels. Résultat : l'autoplay se mettait en pause à cause de son propre scroll.

### Solution implémentée

**Écoute directe des événements utilisateur** :

- `wheel` : Souris, trackpad (desktop)
- `touchstart` / `touchmove` : Mobile

Ces événements sont **uniquement** déclenchés par l'utilisateur, jamais par `window.scrollTo()`.

**Avantages** :

- Détection fiable et immédiate
- Pas besoin de flag ou de comparaisons complexes
- Performance optimale

## Gestion des états

### États Redux

- `isAutoPlaying` : Autoplay actif/inactif
- `autoScrollDirection` : Direction de l'autoplay (1 = forward, -1 = backward)
- `isAutoScrollTemporarilyPaused` : Pause temporaire sur un anchor
- `lastScrollDirection` : Dernière direction scrollée (pour PointTrail)
- `isScrolling` : Scroll en cours (autoplay ou manuel)

### États locaux (refs)

- `isPausedRef` : Pause active (pour éviter les recalculs)
- `lastPausedAnchorIdRef` : Dernier anchor qui a déclenché une pause
- `progressRef` : Progress actuel (pour éviter les dépendances circulaires)
- `isAutoPlayingRef` : État de l'autoplay (pour les callbacks)

## Points d'attention

### 1. Synchronisation après arrêt

Quand l'autoplay s'arrête, le progress est réinitialisé depuis `window.scrollY` pour éviter les décalages. Cette synchronisation se fait dans `useManualScrollSync`.

### 2. Wraparound circulaire

Le progress est toujours normalisé entre 0 et 1 avec le modulo. Cela permet un scroll infini dans les deux sens.

### 3. Bump après pause

Après une pause sur un anchor, un petit "bump" est appliqué pour sortir de la zone de détection de l'anchor et éviter de repasser dessus immédiatement.

### 4. Modal ouverte

L'autoplay s'arrête automatiquement si une modal est ouverte, mais `isAutoPlaying` reste `true` pour permettre la reprise.

## Tests

### Couverture

- **29 tests unitaires** couvrent tous les services de domaine
- Tests pour : calcul du progress, gestion des pauses, détection des anchors, orchestration

### Exécution

```bash
yarn test src/app/MapScroller/hooks/useAutoPlay
```

## Points d'amélioration implémentés

### ✅ 1. Suppression du flag programmatique

Le `programmaticScrollFlag` a été supprimé car il n'est plus nécessaire. On utilise maintenant uniquement les événements `wheel`/`touch` pour détecter les scrolls manuels dans `useManualScrollSync`. Ces événements ne sont jamais déclenchés par `window.scrollTo()`, donc aucun flag n'est nécessaire.

**Changements** :

- Suppression du fichier `programmaticScrollFlag.ts`
- Suppression de toutes les références au flag dans `useAutoPlay`
- Ajout d'un commentaire explicatif sur pourquoi `window.scrollTo()` ne déclenche pas les événements `wheel`/`touch`

### ✅ 2. Suppression de la variable non utilisée

`prevProgressRef` a été supprimé car elle n'était jamais lue, seulement mise à jour. C'était un vestige d'une ancienne implémentation.

**Changements** :

- Suppression de `prevProgressRef` et de son `useEffect` associé
- Nettoyage du code

### 3. Optimisations (déjà bonnes)

- ✅ Utilisation de refs pour éviter les dépendances circulaires
- ✅ Mémoïsation des services de domaine et du use case
- ✅ Calculs optimisés avec `requestAnimationFrame`
- ✅ Pas de recalculs inutiles

**Statut** : Aucune optimisation critique nécessaire.

### 4. Tests d'intégration (optionnel)

Les tests unitaires couvrent bien tous les services de domaine (29 tests). Des tests d'intégration pourraient être ajoutés pour tester le hook complet avec Redux, mais ce n'est pas critique.

**Statut** : Optionnel, les tests unitaires sont suffisants pour garantir la qualité.

## Conclusion

La fonctionnalité autoplay est maintenant :

- ✅ **Fiable** : Détection précise des scrolls manuels vs programmatiques
- ✅ **Fluide** : Pas de saccades, transitions douces
- ✅ **Synchronisée** : Direction toujours cohérente entre autoplay et scroll manuel
- ✅ **Testable** : Architecture DDD avec tests unitaires complets
- ✅ **Maintenable** : Code clair, séparation des responsabilités
