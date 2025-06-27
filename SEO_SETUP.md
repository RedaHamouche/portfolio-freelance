# Configuration SEO et Métadonnées

Ce projet est maintenant configuré avec un système complet de SEO et de métadonnées pour les réseaux sociaux.

## 🎯 Fonctionnalités implémentées

### ✅ Métadonnées de base

- **Titre dynamique** avec template `%s | Reda Portfolio`
- **Description** optimisée pour le SEO
- **Mots-clés** ciblés pour le développement web
- **Auteur** et informations de contact
- **Langue** définie en français

### ✅ Open Graph (Facebook, LinkedIn)

- **Titre** et **description** personnalisés
- **Image** de partage (1200x630px)
- **Type** de contenu défini
- **Locale** en français

### ✅ Twitter Cards

- **Card type** : `summary_large_image`
- **Titre** et **description** optimisés
- **Image** dédiée pour Twitter
- **Créateur** mentionné

### ✅ Données structurées (JSON-LD)

- **Schema.org Person** pour le profil
- **Informations professionnelles** (jobTitle, worksFor)
- **Réseaux sociaux** liés
- **Compétences** listées
- **Contact** et localisation

### ✅ Fichiers techniques

- **robots.txt** pour les moteurs de recherche
- **sitemap.xml** avec les URLs importantes
- **site.webmanifest** pour PWA
- **browserconfig.xml** pour Windows

### ✅ Sécurité

- **Headers HTTP** de sécurité
- **CSP** et autres protections
- **HTTPS** forcé
- **Permissions** restreintes

## 🔧 Configuration

### Fichier principal : `src/config/metadata.ts`

Toutes les métadonnées sont centralisées dans ce fichier. **Modifiez les valeurs suivantes** :

```typescript
export const siteConfig = {
  name: "Reda Portfolio", // Votre nom
  title: "Reda - Développeur Full Stack Freelance", // Titre du site
  description: "...", // Description SEO
  url: "https://reda-portfolio.com", // Votre vrai domaine
  author: {
    name: "Reda",
    email: "contact@reda-portfolio.com", // Votre email
    twitter: "@reda_dev", // Votre Twitter
    linkedin: "https://linkedin.com/in/reda-dev", // Votre LinkedIn
    github: "https://github.com/reda-dev", // Votre GitHub
  },
  verification: {
    google: "your-google-verification-code", // Code Google Search Console
  },
  // ...
};
```

### Images requises

Placez ces images dans le dossier `public/` :

- `og-image.jpg` (1200x630px) - Image de partage
- `twitter-image.jpg` (1200x630px) - Image Twitter
- `favicon.ico` - Icône du site
- `favicon-16x16.png` - Icône 16x16
- `favicon-32x32.png` - Icône 32x32
- `apple-touch-icon.png` (180x180px) - Icône Apple
- `safari-pinned-tab.svg` - Icône Safari
- `android-chrome-192x192.png` - Icône Android
- `android-chrome-512x512.png` - Icône Android
- `mstile-150x150.png` - Icône Windows

## 🚀 Prochaines étapes

### 1. Personnalisation

- Remplacez toutes les valeurs dans `src/config/metadata.ts`
- Créez les images de partage
- Ajoutez votre code Google Search Console

### 2. Vérification

- Testez les partages sur Facebook, Twitter, LinkedIn
- Vérifiez avec [Google Rich Results Test](https://search.google.com/test/rich-results)
- Testez avec [Open Graph Debugger](https://developers.facebook.com/tools/debug/)

### 3. Analytics (optionnel)

Si vous voulez ajouter des analytics plus tard :

- Google Analytics 4
- Google Tag Manager
- Plausible Analytics (privacy-friendly)

## 📊 Outils de test

- **Google Search Console** : Vérification et monitoring
- **Google Rich Results Test** : Test des données structurées
- **Facebook Sharing Debugger** : Test des Open Graph
- **Twitter Card Validator** : Test des Twitter Cards
- **Lighthouse** : Audit SEO complet

## 🔍 SEO Checklist

- [x] Métadonnées complètes
- [x] Open Graph configuré
- [x] Twitter Cards configurées
- [x] Données structurées JSON-LD
- [x] Sitemap XML
- [x] Robots.txt
- [x] Manifeste PWA
- [x] Headers de sécurité
- [x] Favicons multiples
- [x] Langue définie
- [x] Canonical URLs
- [ ] Images de partage créées
- [ ] Code Google Search Console ajouté
- [ ] Domaine configuré
- [ ] Analytics configuré (optionnel)

Votre site est maintenant prêt pour un excellent référencement ! 🎉
