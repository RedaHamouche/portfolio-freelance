# Explication : Mixins et @font-face

## ❌ Les mixins ne fonctionnent PAS sans les @font-face

### Pourquoi ?

Les mixins utilisent des **variables CSS** générées par `next/font/local` :

```scss
@mixin montreal(...) {
  font-family: var(--font-montreal), system-ui, arial, sans-serif;
  // ↑ Cette variable n'existe que si next/font/local génère les @font-face
}
```

### Comment ça fonctionne actuellement ?

1. **`next/font/local` génère automatiquement** :

   - Les règles `@font-face` (injectées dans le `<head>`)
   - Les variables CSS (`--font-montreal`, `--font-playfair`)

2. **Les mixins utilisent ces variables** :

   ```scss
   @mixin montreal(
     $fontSize: 16px,
     $fontWeight: normal,
     $fontStyle: normal,
     $lineHeight: 1.4
   ) {
     font-family: var(--font-montreal), system-ui, arial, sans-serif;
     // ↑ Variable injectée par next/font/local
   }
   ```

3. **Dans `layout.tsx`** :
   ```tsx
   <html className={`${montrealRegular.variable} ${playfairRegular.variable}`}>
   // ↑ Injecte les variables CSS dans le HTML
   ```

### Que se passerait-il sans @font-face ?

Si on supprimait `next/font/local` :

1. ❌ Les variables CSS ne seraient pas définies
2. ❌ Les `@font-face` ne seraient pas générés
3. ❌ Les mixins utiliseraient `var(--font-montreal)` qui n'existe pas
4. ❌ Le fallback (`system-ui, arial`) serait utilisé, mais pas les fonts personnalisées

### Solution : Garder `next/font/local`

**Avantages** :

- ✅ Génération automatique des `@font-face`
- ✅ Optimisation automatique (preload, font-display)
- ✅ Variables CSS injectées automatiquement
- ✅ Pas besoin de gérer manuellement les `@font-face`

**Les mixins fonctionnent grâce à `next/font/local`** qui génère les `@font-face` automatiquement.

---

## Alternative (sans next/font/local)

Si vous vouliez utiliser les mixins sans `next/font/local`, il faudrait :

1. **Définir manuellement les `@font-face`** dans `_typography.scss` :

   ```scss
   @font-face {
     font-family: "Montreal";
     src: url("/fonts/Montreal/Montreal-Regular.woff2") format("woff2");
     font-weight: 400;
     font-style: normal;
   }
   // ... etc
   ```

2. **Modifier les mixins** pour utiliser directement le nom de la font :
   ```scss
   @mixin montreal(...) {
     font-family: "Montreal", system-ui, arial, sans-serif;
     // ↑ Plus de variable CSS, nom direct
   }
   ```

**Mais ce n'est pas recommandé** car on perd les optimisations de `next/font/local`.

---

## Conclusion

**Les mixins dépendent des `@font-face` générés par `next/font/local`.**

Sans les `@font-face`, les variables CSS ne seraient pas définies et les fonts ne se chargeraient pas.

**Status actuel** : ✅ Tout fonctionne car `next/font/local` génère automatiquement les `@font-face`.
