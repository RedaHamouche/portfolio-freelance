# Analyse et Optimisations SCSS

## 📊 État Actuel de l'Architecture

### ✅ Points Forts

#### 1. **Organisation Claire**

- Structure logique : `abstract/`, `base/`, modules par composant
- Séparation des responsabilités : variables, mixins, fonctions
- CSS Modules pour le scoping (évite les conflits de noms)

#### 2. **Modernité**

- Utilisation de `@forward` et `@use` (Dart Sass moderne)
- Mixins réutilisables (`media`, `flex`, `square`, etc.)
- Variables centralisées (`$colors`, `$spacing`, `$breakpoints`)

### ⚠️ Problèmes Identifiés

#### 1. **Performance : `prependData` injecte tout dans chaque module**

**Configuration actuelle** (`next.config.ts`) :

```scss
sassOptions: {
  includePaths: [path.join(__dirname, 'src/styles')],
  prependData: `@use "main" as *;`, // ❌ PROBLÈME
}
```

**Impact** :

- Tous les abstracts sont injectés dans **chaque** `.module.scss`
- Duplication massive du code compilé
- Bundle CSS beaucoup plus volumineux que nécessaire

**Exemple concret** :

- Si vous avez 30 composants avec `.module.scss`
- Les variables/mixins sont dupliqués **30 fois** dans le CSS final
- Au lieu d'être partagés une seule fois

#### 2. **Pas de Tree-Shaking CSS**

- Variables/mixins non utilisés inclus quand même
- Pas de purge automatique des styles inutilisés

#### 3. **Inconsistance des Imports**

- `SvgPathDebugger` utilise `@use '../../styles/abstract/index' as *;` (explicite)
- Les autres composants dépendent de `prependData` (implicite)
- Difficile de savoir d'où viennent les variables

#### 4. **Variables Hardcodées**

```scss
// Dans ProjectCard/index.module.scss
background: pink; // mobile par défaut
background: lightblue; // desktop
```

- Devrait utiliser `$color-*` depuis `_colors.scss`
- Pas de cohérence visuelle

#### 5. **Pas de Design Tokens Structurés**

- Pas de système de tokens (couleurs, espacements, typographie)
- Variables éparpillées

---

## 🎯 Recommandations d'Optimisation

### Phase 1 : Performance (Priorité HAUTE) 🔴

#### 1.1 Supprimer `prependData` et utiliser des imports explicites

**Avant (actuel)** :

```scss
// next.config.ts
prependData: `@use "main" as *;`

// Dans chaque module (implicite)
// Tous les abstracts sont injectés automatiquement
```

**Après (recommandé)** :

```scss
// next.config.ts
sassOptions: {
  includePaths: [path.join(__dirname, 'src/styles')],
  // ❌ Supprimer prependData
},

// Dans chaque module (explicite)
@use '@/styles/abstract/index' as *;
```

**Avantages** :

- ✅ **Tree-shaking** : seuls les fichiers importés sont inclus
- ✅ **Bundle CSS plus petit** : réduction estimée de 30-50%
- ✅ **Imports explicites** : plus facile à comprendre et déboguer
- ✅ **Meilleure performance de build**

**Plan d'action** :

1. Supprimer `prependData` de `next.config.ts`
2. Ajouter `@use '@/styles/abstract/index' as *;` dans chaque `.module.scss`
3. Tester que tout fonctionne
4. Mesurer la réduction du bundle CSS

**Fichiers à modifier** :

- `next.config.ts` (supprimer `prependData`)
- Tous les `.module.scss` (ajouter l'import)

---

### Phase 2 : Maintenabilité (Priorité MOYENNE) 🟡

#### 2.1 Créer un système de Design Tokens

**Structure proposée** :

```
src/styles/
  tokens/
    _colors.scss      # Palette complète avec sémantique
    _spacing.scss     # Espacements cohérents
    _typography.scss  # Tailles, weights, line-heights
    _breakpoints.scss # Breakpoints centralisés
    _shadows.scss     # Ombres réutilisables
    _borders.scss     # Bordures et radius
    _index.scss       # Export unique
```

**Exemple `_colors.scss`** :

```scss
// Palette de base
$color-primary: oklch(0.85 0.08 320);
$color-secondary: oklch(0.89 0.06 150);

// Tokens sémantiques
$color-background-mobile: $color-primary;
$color-background-desktop: $color-secondary;
$color-text-primary: $color-mono-black;
$color-text-secondary: $color-mono-gray-3;
```

**Exemple `_spacing.scss`** :

```scss
// Espacements de base
$spacing-xxs: 4px;
$spacing-xs: 8px;
$spacing-s: 16px;
$spacing-m: 24px;
$spacing-l: 32px;
$spacing-xl: 40px;
$spacing-xxl: 48px;

// Tokens sémantiques
$spacing-card-padding: $spacing-m;
$spacing-section-gap: $spacing-xl;
```

#### 2.2 Migrer les variables hardcodées vers les tokens

**Avant** :

```scss
// ProjectCard/index.module.scss
background: pink; // mobile par défaut
@include media(">=desktop") {
  background: lightblue;
}
```

**Après** :

```scss
@use "@/styles/tokens" as *;

background: $color-background-mobile;
@include media(">=desktop") {
  background: $color-background-desktop;
}
```

**Avantages** :

- ✅ Cohérence visuelle garantie
- ✅ Changements globaux faciles
- ✅ Design system structuré

---

### Phase 3 : Optimisation Avancée (Priorité BASSE) 🟢

#### 3.1 CSS Custom Properties pour le Runtime

Pour les valeurs dynamiques (thèmes, dark mode) :

```scss
// tokens/_colors.scss
:root {
  --color-primary: #{$color-primary};
  --color-secondary: #{$color-secondary};
  --spacing-xs: #{$spacing-xs};
  --spacing-s: #{$spacing-s};
}

// Utilisation dans les composants
.component {
  background: var(--color-primary);
  padding: var(--spacing-s);
}
```

**Avantages** :

- ✅ Changements dynamiques sans recompilation
- ✅ Support du dark mode facile
- ✅ Thèmes personnalisables

#### 3.2 Purge CSS Automatique

Configurer PurgeCSS pour supprimer les styles inutilisés :

```js
// next.config.ts
const withPurgeCSS = require("next-purgecss");

module.exports = withPurgeCSS({
  // Configuration PurgeCSS
});
```

**Avantages** :

- ✅ Bundle CSS encore plus petit
- ✅ Suppression automatique des styles morts

---

## 📈 Estimation d'Impact

### Performance

| Métrique           | Avant     | Après     | Amélioration     |
| ------------------ | --------- | --------- | ---------------- |
| **Bundle CSS**     | ~X KB     | ~X-30% KB | **-30 à -50%**   |
| **Temps de build** | Xs        | X-5% s    | **-5 à -10%**    |
| **Runtime**        | Identique | Identique | Aucun changement |

### Maintenabilité

- ✅ **Imports explicites** = plus facile à déboguer
- ✅ **Tokens centralisés** = changements globaux simples
- ✅ **Cohérence visuelle** = design system structuré

---

## 🚀 Plan d'Implémentation

### Étape 1 : Audit (30 min)

1. Lister tous les fichiers `.module.scss`
2. Identifier les variables hardcodées
3. Compter les duplications actuelles

### Étape 2 : Phase 1 - Performance (2-3h)

1. ✅ Supprimer `prependData` de `next.config.ts`
2. ✅ Ajouter `@use '@/styles/abstract/index' as *;` dans chaque module
3. ✅ Tester que tout fonctionne
4. ✅ Mesurer la réduction du bundle CSS
5. ✅ Commit : "perf: remove prependData, use explicit SCSS imports"

### Étape 3 : Phase 2 - Tokens (4-6h)

1. ✅ Créer le dossier `tokens/`
2. ✅ Migrer les variables vers les tokens
3. ✅ Remplacer les valeurs hardcodées
4. ✅ Tester la cohérence visuelle
5. ✅ Commit : "refactor: implement design tokens system"

### Étape 4 : Phase 3 - Optimisation (2-3h)

1. ✅ Ajouter CSS custom properties
2. ✅ Configurer PurgeCSS (optionnel)
3. ✅ Tester les performances
4. ✅ Commit : "perf: add CSS custom properties and PurgeCSS"

---

## 📝 Notes Techniques

### Migration `prependData` → Imports Explicites

**Script pour automatiser** (optionnel) :

```bash
# Trouver tous les .module.scss sans import
find src -name "*.module.scss" -exec grep -L "@use.*abstract" {} \;

# Ajouter l'import au début de chaque fichier
find src -name "*.module.scss" -exec sed -i '' '1i\
@use "@/styles/abstract/index" as *;
' {} \;
```

**Fichiers à modifier manuellement** :

- `next.config.ts` : supprimer `prependData`
- Vérifier que `SvgPathDebugger` utilise déjà l'import (garder tel quel)

### Compatibilité

- ✅ Compatible avec Next.js 15
- ✅ Compatible avec Dart Sass
- ✅ Pas de breaking changes pour les composants existants

---

## 🔍 Checklist de Validation

### Phase 1

- [ ] `prependData` supprimé de `next.config.ts`
- [ ] Tous les `.module.scss` ont `@use '@/styles/abstract/index' as *;`
- [ ] Build passe sans erreurs
- [ ] Bundle CSS réduit de 30-50%
- [ ] Tests visuels : pas de régression

### Phase 2

- [ ] Dossier `tokens/` créé avec tous les fichiers
- [ ] Variables hardcodées remplacées par des tokens
- [ ] Cohérence visuelle vérifiée
- [ ] Documentation des tokens à jour

### Phase 3

- [ ] CSS custom properties ajoutées
- [ ] PurgeCSS configuré (si nécessaire)
- [ ] Tests de performance passés

---

## 📚 Ressources

- [Sass @use vs @import](https://sass-lang.com/documentation/at-rules/use)
- [Next.js Sass Configuration](https://nextjs.org/docs/app/building-your-application/styling/sass)
- [Design Tokens Best Practices](https://www.lightningdesignsystem.com/design-tokens/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

---

**Date de création** : 2025-01-27  
**Statut** : 📋 À faire (après finalisation du projet)  
**Priorité** : 🔴 Phase 1 (Performance) → 🟡 Phase 2 (Maintenabilité) → 🟢 Phase 3 (Optimisation)
