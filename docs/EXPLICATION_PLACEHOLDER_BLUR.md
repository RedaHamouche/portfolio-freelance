# Explication : Placeholder Blur

## 🎯 Qu'est-ce qu'un Placeholder Blur ?

Un **placeholder blur** est une **version très petite et floutée** de votre image qui s'affiche **immédiatement** pendant que la vraie image se charge.

### 📸 Exemple Visuel

**Sans placeholder blur** :
```
1. Page se charge → Zone vide (blanc/gris)
2. Image se télécharge (2-3 secondes)
3. Image apparaît → Saut visuel brusque
```

**Avec placeholder blur** :
```
1. Page se charge → Placeholder blur s'affiche INSTANTANÉMENT (10px flouté)
2. Image se télécharge (2-3 secondes)
3. Image apparaît en fondu → Transition fluide
```

---

## 🔍 Comment ça fonctionne concrètement ?

### Étape 1 : Génération côté serveur

Quand Next.js génère la page côté serveur :

```typescript
// 1. On prend votre image : /images/project.jpg (800x600px, 200KB)
// 2. On génère un placeholder : version 10x10px floutée, encodée en base64
// 3. Résultat : "data:image/jpeg;base64,/9j/4AAQSkZJRg..." (quelques KB)
```

**Exemple concret** :
- Image originale : `portfolio-desktop.jpg` (800x600px, 200KB)
- Placeholder généré : Version 10x10px floutée → `"data:image/jpeg;base64,/9j/4AAQSkZJRg..."` (2KB)

### Étape 2 : Affichage côté client

```tsx
<NextImage
  src="/images/portfolio-desktop.jpg"  // La vraie image (200KB)
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."  // Le placeholder (2KB)
  placeholder="blur"  // Active le placeholder
/>
```

**Ce qui se passe** :
1. ✅ Le placeholder blur s'affiche **instantanément** (2KB, déjà dans le HTML)
2. ⏳ La vraie image se charge en arrière-plan (200KB)
3. ✅ Transition fluide vers la vraie image

---

## 💡 Pourquoi c'est utile ?

### Problème sans placeholder

```
Temps 0ms   : Page se charge
Temps 0-2000ms : Zone vide (blanc/gris) ← Mauvais pour l'UX
Temps 2000ms : Image apparaît brusquement ← Saut visuel
```

**Résultat** :
- ❌ L'utilisateur voit une zone vide
- ❌ Saut visuel brusque quand l'image apparaît
- ❌ Mauvaise perception de performance

### Solution avec placeholder blur

```
Temps 0ms   : Page se charge
Temps 0ms   : Placeholder blur s'affiche INSTANTANÉMENT ← Bon pour l'UX
Temps 0-2000ms : Placeholder visible (donne une idée du contenu)
Temps 2000ms : Image apparaît en fondu ← Transition fluide
```

**Résultat** :
- ✅ L'utilisateur voit immédiatement quelque chose
- ✅ Transition fluide vers la vraie image
- ✅ Meilleure perception de performance

---

## 📊 Impact sur les performances

### Métriques Core Web Vitals

**LCP (Largest Contentful Paint)** : Temps pour afficher le plus grand élément visible

- **Sans placeholder** : LCP = 2-3 secondes (quand l'image se charge)
- **Avec placeholder** : LCP = 0.1-0.3 secondes (quand le placeholder s'affiche)

**Gain** : **-200-400ms** sur le LCP ✅

---

## 🔧 Comment c'est implémenté dans votre projet

### 1. Génération côté serveur (`page.tsx`)

```typescript
// Quand la page se charge côté serveur
const imagePlaceholders = await generateAllImagePlaceholders(serverConfigs);

// Résultat :
// {
//   "piece-of-art": {
//     blurDataURL: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
//     mobileBlurDataURL: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
//     desktopBlurDataURL: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
//   }
// }
```

### 2. Passage au client (`MapScrollerWrapper`)

```tsx
<ImagePlaceholdersProvider placeholders={imagePlaceholders}>
  {/* Les composants peuvent maintenant accéder aux placeholders */}
</ImagePlaceholdersProvider>
```

### 3. Utilisation dans les composants (`PieceOfArt`)

```tsx
// Récupérer le placeholder pour ce composant
const placeholder = getPlaceholder('piece-of-art');

// Utiliser le placeholder approprié selon mobile/desktop
const blurDataURL = isDesktop
  ? placeholder.desktopBlurDataURL
  : placeholder.mobileBlurDataURL;

// Passer au composant Image
<Image
  src="/images/art.jpg"
  blurDataURL={blurDataURL}  // ← Le placeholder blur
  placeholder="blur"  // ← Active le placeholder
/>
```

---

## 🎨 Exemple concret dans votre code

### Avant (sans placeholder)

```tsx
<Image
  src="/images/portfolio-desktop.jpg"
  alt="Portfolio"
/>
```

**Résultat** :
- Zone vide pendant 2-3 secondes
- Image apparaît brusquement

### Après (avec placeholder)

```tsx
<Image
  src="/images/portfolio-desktop.jpg"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."  // ← Placeholder blur
  placeholder="blur"  // ← Active le placeholder
  alt="Portfolio"
/>
```

**Résultat** :
- Placeholder blur visible immédiatement (0.1s)
- Transition fluide vers la vraie image (2-3s)

---

## 📝 Résumé

**Placeholder blur** = Version **très petite et floutée** de votre image qui s'affiche **instantanément** pendant que la vraie image se charge.

**Avantages** :
- ✅ Affichage immédiat (pas de zone vide)
- ✅ Transition fluide
- ✅ Meilleure perception de performance
- ✅ Gain de -200-400ms sur le LCP

**Comment ça marche** :
1. Serveur génère le placeholder blur (10x10px flouté, base64)
2. Placeholder inclus dans le HTML (quelques KB)
3. Placeholder s'affiche instantanément
4. Vraie image se charge en arrière-plan
5. Transition fluide vers la vraie image

---

## 🔍 Voir en action

Pour voir la différence :

1. **Sans placeholder** : Ouvrez les DevTools → Network → Throttle à "Slow 3G"
   - Vous verrez une zone vide pendant le chargement

2. **Avec placeholder** : Même test
   - Vous verrez le placeholder blur immédiatement
   - Puis transition fluide vers la vraie image

---

**En résumé** : Le placeholder blur est une **prévisualisation floutée** de votre image qui s'affiche **instantanément** pour améliorer l'expérience utilisateur et les performances perçues.

