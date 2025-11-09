# Analyse du Bug Safari iOS : Contenu de `<main>` disparaît quand progress = 0

## Problème

Sur Safari iOS, tout le contenu de `<main>` dans `MapScroller` disparaît lorsque le `PointTrail` est à la position 0 (progress = 0).

## Analyse du Code

### Structure actuelle

1. **`<main>`** : `position: relative`, contient :
   - `<Cursor />` : `position: fixed`, `z-index: 10000`
   - `<div>` scroll factice : `z-index: 0`
   - `<div.viewportFixed>` : `position: fixed`, `z-index: 1`, `isolation: isolate`, `transform: translateZ(0)`
     - `<MapViewport>` : `position: absolute`, `z-index: 2`
       - `<PointTrail>` : `position: absolute`, `contain: layout style paint`

### Propriétés CSS problématiques identifiées

1. **`isolation: isolate`** sur `.viewportFixed`

   - Crée un nouveau stacking context
   - Peut causer des problèmes sur Safari iOS avec `position: fixed`

2. **`transform: translateZ(0)`** sur `.viewportFixed`

   - Force un nouveau layer GPU
   - Peut créer un stacking context qui cache le contenu parent

3. **`contain: layout style paint`** sur plusieurs éléments

   - Peut causer des problèmes de rendu sur Safari iOS
   - Particulièrement avec `position: fixed` et les stacking contexts

4. **Combinaison `isolation` + `transform` + `position: fixed`**
   - Cette combinaison est connue pour causer des bugs sur Safari iOS
   - Le stacking context créé peut cacher le contenu de `<main>`

## Hypothèses

### Hypothèse 1 : Conflit de stacking context

Quand `progress = 0`, le calcul de `nextComponent` peut retourner `null`, ce qui fait que `PointTrail` n'est pas rendu. Cependant, le vrai problème est que le stacking context créé par `.viewportFixed` cache le contenu de `<main>` sur Safari iOS.

### Hypothèse 2 : Bug Safari iOS avec `isolation: isolate`

Safari iOS a des bugs connus avec `isolation: isolate` combiné avec `position: fixed` et `transform`. Le contenu peut disparaître dans certains cas.

### Hypothèse 3 : Problème avec `contain` sur iOS

La propriété `contain: layout style paint` peut causer des problèmes de rendu sur Safari iOS, particulièrement avec les éléments `position: fixed`.

## Solutions proposées

### Solution 1 : Retirer `isolation: isolate` (PRIORITÉ HAUTE)

**Hypothèse** : `isolation: isolate` cause le bug sur Safari iOS.

**Action** :

- Retirer `isolation: isolate` de `.viewportFixed`
- Garder `transform: translateZ(0)` pour l'accélération GPU
- Tester si le contenu reste visible

**Risque** : Peut causer d'autres problèmes de z-index, mais moins probable.

### Solution 2 : Changer `transform: translateZ(0)` en `transform: translate3d(0, 0, 0)`

**Hypothèse** : `translateZ(0)` peut causer des problèmes sur Safari iOS.

**Action** :

- Remplacer `transform: translateZ(0)` par `transform: translate3d(0, 0, 0)`
- Garder `isolation: isolate` si nécessaire

### Solution 3 : Retirer `contain` de `.viewportFixed` et `.pointContainer`

**Hypothèse** : `contain: layout style paint` cause des problèmes de rendu sur Safari iOS.

**Action** :

- Retirer `contain: layout style paint` de `.viewportFixed` (dans `index.module.scss`)
- Retirer `contain: layout style paint` de `.pointContainer` (dans `PointTrail/index.module.scss`)
- Garder `will-change: transform` pour l'optimisation

**Risque** : Peut légèrement réduire les performances, mais devrait résoudre le bug.

### Solution 4 : Utiliser `position: absolute` au lieu de `position: fixed` pour `.viewportFixed`

**Hypothèse** : `position: fixed` combiné avec `isolation` et `transform` cause le bug.

**Action** :

- Changer `.viewportFixed` de `position: fixed` à `position: absolute`
- Ajuster le parent pour gérer le positionnement
- **Note** : Cette solution est plus risquée car elle change l'architecture

### Solution 5 : Ajouter un `min-height` et `min-width` à `<main>`

**Hypothèse** : Safari iOS cache le contenu si le parent n'a pas de dimensions explicites.

**Action** :

- Ajouter `min-height: 100vh` et `min-width: 100vw` à `.main`
- Forcer le rendu du contenu

### Solution 6 : Forcer le re-render avec une clé conditionnelle

**Hypothèse** : React ne re-rend pas correctement quand `progress = 0`.

**Action** :

- Ajouter une `key` conditionnelle basée sur `progress` (mais pas directement `progress` pour éviter les re-renders)
- Utiliser `key={progress > 0 ? 'active' : 'inactive'}` sur `.viewportFixed`

## Plan d'action recommandé

1. **Étape 1** : Tester Solution 3 (retirer `contain` de `.viewportFixed` et `.pointContainer`)

   - Impact faible sur les performances
   - Probabilité élevée de résoudre le bug

2. **Étape 2** : Si Solution 3 ne fonctionne pas, tester Solution 1 (retirer `isolation: isolate`)

   - Impact moyen (peut causer des problèmes de z-index)
   - Probabilité moyenne de résoudre le bug

3. **Étape 3** : Si Solution 1 ne fonctionne pas, tester Solution 2 (changer `translateZ(0)` en `translate3d(0, 0, 0)`)

   - Impact faible
   - Probabilité faible de résoudre le bug seul

4. **Étape 4** : Si aucune solution ne fonctionne, combiner Solutions 1 + 3

   - Retirer `isolation: isolate` ET `contain`
   - Probabilité élevée de résoudre le bug

5. **Étape 5** : Si toujours pas résolu, tester Solution 5 (ajouter `min-height`/`min-width` à `<main>`)
   - Impact très faible
   - Probabilité faible mais peut aider

## Tests à effectuer

1. Tester sur Safari iOS (iPhone réel ou simulateur)
2. Vérifier que le contenu reste visible quand `progress = 0`
3. Vérifier que le scroll fonctionne toujours correctement
4. Vérifier que les z-index fonctionnent toujours (Cursor, PointTrail, etc.)
5. Vérifier les performances (pas de régression)

## Notes supplémentaires

- Le commentaire dans le code mentionne "éviter le bug iOS 26" - il semble que `isolation: isolate` ait été ajouté pour résoudre un autre bug, mais peut causer celui-ci
- Le `PointTrail` n'est pas rendu quand `nextComponent` est `null`, mais le problème est que TOUT le contenu de `<main>` disparaît, pas juste le PointTrail
- Le bug est spécifique à Safari iOS, ce qui suggère un problème de stacking context ou de rendu GPU
