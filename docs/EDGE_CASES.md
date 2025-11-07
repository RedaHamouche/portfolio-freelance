# Edge Cases - Système de Scroll

## 📋 Liste des Edge Cases Identifiés

### 1. localStorage corrompu

**Description** : Le localStorage contient un progress invalide (hors de [0, 1] ou non numérique)

**Comportement actuel** : ✅ Déjà géré par `ProgressPersistenceService`

- Validation automatique dans `getProgress()`
- Nettoyage automatique si valeur invalide
- Fallback vers default progress

**Test** :

- Mettre manuellement `localStorage.setItem('scrollProgress', '2.5')`
- Mettre manuellement `localStorage.setItem('scrollProgress', 'invalid')`
- Vérifier que le système utilise le default progress

---

### 2. Hash invalide

**Description** : L'URL contient un `#anchorId` qui n'existe pas dans le path

**Comportement actuel** : ✅ Déjà géré

- `getProgressFromHash()` retourne `null` si anchorId non trouvé
- Fallback automatique vers localStorage > default

**Test** :

- Accéder à `/#invalidAnchorId`
- Vérifier que le système utilise localStorage ou default progress
- Vérifier qu'un warning est loggé (si implémenté)

---

### 3. pathLength qui ne change jamais

**Description** : Le SVG ne charge jamais, `pathLength` reste à 2000 (valeur par défaut)

**Comportement actuel** : ⚠️ Partiellement géré

- Le scroll initial ne se fait jamais (bloqué ligne 68)
- Le scroll manuel fonctionne quand même

**Amélioration suggérée** :

- Ajouter un timeout pour forcer le scroll même si pathLength = 2000
- Ou accepter pathLength = 2000 pour le scroll initial si timeout dépassé

**Test** :

- Simuler un SVG qui ne charge jamais
- Vérifier que le scroll fonctionne quand même après un délai

---

### 4. Progress qui change entre étape 1 et 2

**Description** : L'utilisateur scroll manuellement avant que `pathLength` arrive, donc `currentProgress` change

**Comportement actuel** : ⚠️ Potentiel problème

- `hasScrolledRef` empêche le scroll initial si l'utilisateur a déjà scrollé
- Le scroll initial utilise le `currentProgress` actuel (qui peut avoir changé)

**Amélioration suggérée** :

- Stocker le progress initial dans une ref
- Utiliser ce progress initial pour le scroll, pas le currentProgress

**Test** :

- Charger la page avec un hash
- Scroll manuellement avant que pathLength arrive
- Vérifier que le scroll initial se fait quand même avec le bon progress

---

### 5. window.scrollTo() qui échoue

**Description** : `window.scrollTo()` peut échouer (mode privé, restrictions navigateur, etc.)

**Comportement actuel** : ❌ Pas de gestion d'erreur

**Amélioration suggérée** :

- Wrapper `window.scrollTo()` dans un try/catch
- Logger l'erreur en mode dev
- Continuer le flux normalement (le scroll manuel fonctionnera)

**Test** :

- Simuler une erreur sur `window.scrollTo()`
- Vérifier que l'application ne crash pas
- Vérifier que le scroll manuel fonctionne quand même

---

### 6. Hash qui change après initialisation

**Description** : L'utilisateur change l'URL (ajoute/modifie le hash) après le chargement initial

**Comportement actuel** : ⚠️ Pas de réinitialisation automatique

**Amélioration suggérée** :

- Écouter les changements de hash avec `window.addEventListener('hashchange')`
- Réinitialiser le progress si hash change
- Faire un scroll vers le nouveau hash

**Test** :

- Charger la page normalement
- Changer l'URL pour ajouter `#anchorId`
- Vérifier que le scroll se fait vers le nouveau hash

---

### 7. pathLength qui change plusieurs fois

**Description** : Le SVG se recharge ou change de taille, `pathLength` change plusieurs fois

**Comportement actuel** : ⚠️ `hasScrolledRef` empêche un nouveau scroll

**Amélioration suggérée** :

- Réinitialiser `hasScrolledRef` si `pathLength` change significativement
- Ou accepter plusieurs scrolls si le pathLength change de plus de X%

**Test** :

- Charger la page
- Simuler un changement de pathLength (ex: SVG qui se redimensionne)
- Vérifier que le scroll se réajuste

---

### 8. Utilisateur scroll avant pathLength

**Description** : L'utilisateur scroll manuellement avant que `pathLength` arrive

**Comportement actuel** : ✅ Fonctionne

- Le scroll manuel fonctionne même si pathLength = 2000
- Mais le scroll initial ne se fait jamais si l'utilisateur a déjà scrollé

**Amélioration suggérée** :

- Vérifier si l'utilisateur a scrollé avant de faire le scroll initial
- Si oui, ne pas faire de scroll initial (l'utilisateur a déjà pris le contrôle)

**Test** :

- Charger la page
- Scroll manuellement immédiatement
- Vérifier que le scroll initial ne se fait pas (ou se fait quand même ?)

---

### 9. SSR / window undefined

**Description** : Le code s'exécute côté serveur où `window` n'existe pas

**Comportement actuel** : ⚠️ Partiellement géré

- `window.location.hash` utilisé sans vérification dans `useScrollInitialization`
- Fonctionne en client, mais pourrait causer des problèmes en SSR strict

**Amélioration suggérée** :

- Ajouter `typeof window !== 'undefined'` avant d'utiliser `window`

**Test** :

- Vérifier que le code ne crash pas en SSR
- Vérifier que l'hydratation fonctionne correctement

---

### 10. Progress invalide depuis hash

**Description** : Un composant a un `progress` invalide (hors de [0, 1])

**Comportement actuel** : ❌ Pas de validation

**Amélioration suggérée** :

- Valider le progress retourné par `getProgressFromHash()`
- Fallback vers localStorage/default si invalide

**Test** :

- Créer un composant avec `progress: 1.5`
- Accéder avec `#anchorId`
- Vérifier que le système utilise localStorage/default

---

## 🧪 Tests à Ajouter

### Tests Unitaires

- [ ] `ProgressPersistenceService` : Test avec valeurs invalides
- [ ] `ScrollInitializationService` : Test avec hash invalide
- [ ] `useScrollInitialization` : Test avec progress invalide

### Tests d'Intégration

- [ ] Test avec localStorage corrompu
- [ ] Test avec hash invalide
- [ ] Test avec pathLength qui ne change jamais
- [ ] Test avec window.scrollTo() qui échoue
- [ ] Test avec hash qui change après initialisation

### Tests E2E

- [ ] Test complet du flux avec tous les edge cases
- [ ] Test sur différents navigateurs (Safari iOS, Chrome, Firefox)
- [ ] Test en mode privé

---

## 📝 Notes

- Les edge cases marqués ✅ sont déjà bien gérés
- Les edge cases marqués ⚠️ nécessitent une amélioration
- Les edge cases marqués ❌ nécessitent une correction
