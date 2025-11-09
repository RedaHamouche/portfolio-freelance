# Placeholder Blur : Génération Automatique

## ✅ C'est 100% Automatique !

**Vous n'avez RIEN à faire manuellement.** Le système génère automatiquement les placeholders blur pour toutes vos images locales.

---

## 🔄 Comment ça fonctionne automatiquement

### 1. Vous ajoutez une image dans votre JSON

```json
{
  "id": "mon-projet",
  "type": "PieceOfArt",
  "src": "/images/mon-projet.jpg",
  "mobileSrc": "/images/mon-projet-mobile.jpg",
  "desktopSrc": "/images/mon-projet-desktop.jpg"
}
```

### 2. Le système génère automatiquement les placeholders

Quand Next.js génère la page côté serveur :

```typescript
// Dans page.tsx (automatique)
const imagePlaceholders = await generateAllImagePlaceholders(serverConfigs);

// Le système :
// 1. Lit tous les composants dans vos JSONs
// 2. Extrait toutes les images (src, mobileSrc, desktopSrc)
// 3. Pour chaque image locale (/images/...), génère automatiquement un placeholder blur
// 4. Résultat : placeholders prêts à l'emploi
```

### 3. Les placeholders sont utilisés automatiquement

```tsx
// Dans PieceOfArt (automatique)
const placeholder = getPlaceholder('mon-projet');
// → Récupère automatiquement le placeholder généré

<Image
  src="/images/mon-projet.jpg"
  blurDataURL={placeholder.blurDataURL}  // ← Automatique !
  placeholder="blur"
/>
```

---

## 📋 Ce que vous devez faire (et ne pas faire)

### ✅ À FAIRE

1. **Ajouter vos images dans `/public/images/`**
   ```
   public/
   └── images/
       ├── mon-projet.jpg
       ├── mon-projet-mobile.jpg
       └── mon-projet-desktop.jpg
   ```

2. **Référencer les images dans vos JSONs**
   ```json
   {
     "id": "mon-projet",
     "type": "PieceOfArt",
     "src": "/images/mon-projet.jpg",
     "mobileSrc": "/images/mon-projet-mobile.jpg",
     "desktopSrc": "/images/mon-projet-desktop.jpg"
   }
   ```

3. **C'est tout !** Le placeholder sera généré automatiquement ✅

### ❌ À NE PAS FAIRE

- ❌ **Ne pas créer manuellement des versions floutées** → Le système le fait automatiquement
- ❌ **Ne pas encoder en base64 manuellement** → Le système le fait automatiquement
- ❌ **Ne pas ajouter les placeholders dans le JSON** → Le système les génère automatiquement

---

## 🔍 Détails techniques

### Quand les placeholders sont générés ?

**À chaque rendu serveur** (build ou requête) :

1. Next.js appelle `page.tsx` (Server Component)
2. `generateAllImagePlaceholders()` est appelé automatiquement
3. Le système parcourt tous les composants dans les JSONs
4. Pour chaque image locale trouvée, génère un placeholder blur
5. Les placeholders sont passés aux composants via le contexte

### Où sont stockés les placeholders ?

**En mémoire, côté serveur** → Passés au client via les props React

Les placeholders ne sont **pas** stockés dans des fichiers. Ils sont générés à chaque build/requête.

### Performance

- **Génération** : ~10-50ms par image (côté serveur)
- **Taille** : ~2-5KB par placeholder (base64)
- **Impact** : Négligeable côté serveur, gain important côté client

---

## 🎯 Exemple concret

### Scénario : Vous ajoutez une nouvelle image

**Étape 1** : Vous ajoutez l'image
```bash
# Vous copiez votre image
cp ~/Desktop/nouveau-projet.jpg public/images/nouveau-projet.jpg
```

**Étape 2** : Vous l'ajoutez dans le JSON
```json
{
  "id": "nouveau-projet",
  "type": "PieceOfArt",
  "src": "/images/nouveau-projet.jpg"
}
```

**Étape 3** : C'est tout ! ✅

Le système :
- ✅ Détecte automatiquement l'image dans le JSON
- ✅ Génère automatiquement le placeholder blur
- ✅ L'utilise automatiquement dans le composant

**Vous n'avez rien d'autre à faire !**

---

## ⚠️ Limitations

### Images locales uniquement

Le système génère des placeholders **uniquement pour les images locales** (`/images/...`).

**Images externes** (Unsplash, CDN, etc.) :
- ❌ Pas de placeholder généré automatiquement
- ✅ Mais ça fonctionne quand même (sans placeholder)

### Images manquantes

Si une image référencée dans le JSON n'existe pas dans `/public/images/` :
- ⚠️ Le placeholder ne sera pas généré
- ✅ Le composant fonctionnera quand même (sans placeholder)

---

## 🔧 Vérifier que ça fonctionne

### 1. Vérifier dans les DevTools

Ouvrez les DevTools → Network → Rechargez la page

Vous devriez voir :
- Les images se charger normalement
- Mais avec un placeholder blur qui s'affiche **avant** l'image

### 2. Vérifier dans le code

Dans `page.tsx`, ajoutez un `console.log` :

```typescript
const imagePlaceholders = await generateAllImagePlaceholders(serverConfigs);
console.log('Placeholders générés:', Object.keys(imagePlaceholders));
// → Devrait afficher les IDs des composants avec images
```

---

## 📝 Résumé

**Question** : Le placeholder est auto-généré ou je dois créer une version floutée manuellement ?

**Réponse** : ✅ **100% automatique !**

- ✅ Vous ajoutez juste l'image dans `/public/images/`
- ✅ Vous la référencez dans votre JSON
- ✅ Le système génère automatiquement le placeholder blur
- ✅ Le placeholder est utilisé automatiquement dans les composants

**Vous n'avez rien à faire manuellement !** 🎉

