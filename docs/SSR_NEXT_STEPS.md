# Prochaines Optimisations SSR

**Date** : Plan des optimisations SSR restantes  
**Objectif** : Identifier les optimisations suivantes avec le meilleur impact

---

## ✅ Ce qui a été fait

1. ✅ **Pré-chargement des configurations JSON** (Phase 1)
2. ✅ **Pré-calcul du progress initial** (Phase 1)
3. ✅ **Détection du device côté serveur** (Phase 2)

**Gain total** : **-110-230ms** sur le FCP et TTI

---

## 🎯 Optimisations Restantes (Par Priorité)

### 🔴 Priorité Haute : Optimisation des Images (Gain Réel Important)

#### 4. 🖼️ Placeholders Blur pour les Images

**Problème actuel** :
- Les images utilisent `NextImage` mais sans placeholder blur
- Placeholder skeleton côté client uniquement
- Pas de pré-chargement des images critiques

**Gain estimé** :
- ⚡ **-200-400ms** sur le Largest Contentful Paint (LCP)
- ✅ Meilleure perception de performance
- ✅ Pas de layout shift

**Complexité** : 🟡 Moyenne (nécessite `plaiceholder`)

**Implémentation** :
1. Installer `plaiceholder` : `yarn add plaiceholder sharp`
2. Créer helper pour générer les placeholders côté serveur
3. Pré-générer les placeholders pour les images critiques
4. Passer les `blurDataURL` aux composants Image

**Fichiers à modifier** :
- `src/components/commons/Image/index.tsx`
- `src/components/templatingComponents/path/ResponsiveImage/index.tsx`
- Créer `src/utils/ssr/generateImagePlaceholders.ts`

---

### 🟡 Priorité Moyenne : Code Splitting (Gain Réel Important)

#### 5. 📦 Code Splitting Intelligent

**Problème actuel** :
- Tout le code est dans un seul bundle
- GSAP, animations, composants lourds chargés immédiatement
- Pas de lazy loading pour les composants non critiques

**Gain estimé** :
- ⚡ **-200-400ms** sur le FCP
- ⚡ **-100-200ms** sur le TTI
- ✅ Bundle initial plus petit

**Complexité** : 🟡 Moyenne

**Implémentation** :
1. Lazy load GSAP et plugins (déjà fait partiellement)
2. Lazy load les composants templating non critiques
3. Dynamic imports pour les composants lourds
4. Code splitting par route (si plusieurs pages)

**Fichiers à modifier** :
- `src/templating/mappingComponent.ts` (déjà utilise `dynamic()`)
- Composants lourds (animations, modals, etc.)
- `src/components/app/MapScroller/index.tsx`

---

### 🟢 Priorité Faible : Optimisations Avancées

#### 6. 🎯 Pré-calcul du Path Length (Gain Minime)

**Problème actuel** :
- `svgPath.getTotalLength()` appelé côté client
- Calculé après le rendu du SVG

**Gain estimé** :
- ⚡ **-10-50ms** (gain minime)

**Complexité** : 🔴 Élevée (nécessite parser SVG côté serveur)

**Recommandation** : ⚠️ **Ne pas implémenter** - Gain trop faible pour la complexité

---

#### 7. 📄 Métadonnées Dynamiques (SEO)

**Problème actuel** :
- Métadonnées basiques dans `layout.tsx`
- Pas d'Open Graph ou Twitter Cards

**Gain estimé** :
- ✅ Amélioration SEO
- ✅ Meilleur partage social

**Complexité** : 🟢 Faible

**Recommandation** : ⚠️ **Mise de côté** (comme demandé)

---

## 🚀 Plan d'Implémentation Recommandé

### Phase 3 : Optimisation des Images (Priorité 🔴)

**Temps estimé** : 2-3 heures  
**Gain estimé** : **-200-400ms** sur le LCP

**Étapes** :
1. Installer `plaiceholder` et `sharp`
2. Créer helper pour générer les placeholders
3. Identifier les images critiques (above-the-fold)
4. Pré-générer les placeholders au build time ou runtime
5. Passer les `blurDataURL` aux composants Image

**Impact** : ✅✅✅ **Énorme** sur la perception de performance

---

### Phase 4 : Code Splitting (Priorité 🟡)

**Temps estimé** : 3-4 heures  
**Gain estimé** : **-200-400ms** sur le FCP

**Étapes** :
1. Analyser le bundle actuel (via `yarn build --analyze`)
2. Identifier les dépendances lourdes (GSAP, etc.)
3. Lazy load les composants non critiques
4. Dynamic imports pour les animations
5. Code splitting par route si nécessaire

**Impact** : ✅✅ **Important** sur le temps de chargement initial

---

## 📊 Comparaison des Gains

| Optimisation | Gain Estimé | Complexité | Priorité |
|-------------|-------------|------------|----------|
| **Placeholders Blur** | **-200-400ms** (LCP) | 🟡 Moyenne | 🔴 **Haute** |
| **Code Splitting** | **-200-400ms** (FCP) | 🟡 Moyenne | 🟡 Moyenne |
| Pré-calcul Path Length | -10-50ms | 🔴 Élevée | 🟢 Faible |
| Métadonnées SEO | SEO uniquement | 🟢 Faible | 🟢 Faible (mis de côté) |

---

## 🎯 Recommandation

### Implémenter en Priorité

1. **Placeholders Blur pour les Images** (Phase 3)
   - Gain réel important sur le LCP
   - Améliore la perception de performance
   - Complexité raisonnable

2. **Code Splitting** (Phase 4)
   - Gain réel important sur le FCP
   - Réduit la taille du bundle initial
   - Complexité raisonnable

### Ne pas Implémenter (Pour l'instant)

- Pré-calcul du Path Length (gain trop faible)
- Métadonnées SEO (mis de côté)

---

## 📈 Gains Totaux Estimés (Après Toutes les Optimisations)

| Métrique | Avant | Après Phase 1+2 | Après Phase 3+4 | Amélioration |
|----------|-------|-----------------|-----------------|--------------|
| **FCP** | ~1.5-2.5s | ~1.3-2.2s | **~1.0-1.5s** | **-33-40%** |
| **TTI** | ~2.5-3.5s | ~2.3-3.2s | **~2.0-2.5s** | **-20-28%** |
| **LCP** | ~2.5-4s | ~2.5-4s | **~2.0-3.0s** | **-20-25%** |

**Amélioration globale estimée** : **-25-35%** sur les métriques de performance

---

## 🚀 Prochaine Étape

**Recommandation** : Implémenter **Phase 3 - Placeholders Blur** car :
- ✅ Gain réel important (-200-400ms sur LCP)
- ✅ Complexité raisonnable
- ✅ Impact utilisateur visible immédiatement

Souhaitez-vous que je commence par l'optimisation des images avec placeholders blur ?

