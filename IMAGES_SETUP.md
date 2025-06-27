# Guide d'utilisation des images optimisées

## 🎯 **Composant Image optimisé**

Le composant `src/app/Image/index.tsx` offre une solution complète pour l'optimisation des images avec :

### ✅ **Fonctionnalités**

- **Lazy loading** automatique avec Intersection Observer
- **Images responsives** (mobile/desktop)
- **Formats modernes** (WebP, AVIF) via Next.js
- **Placeholder** avec animation shimmer
- **Fallback** automatique en cas d'erreur
- **Animations** fluides au chargement

### ✅ **Performance**

- **Chargement différé** : images chargées seulement quand visibles
- **Tailles optimisées** : images adaptées à chaque écran
- **Qualité configurable** : 85% par défaut (équilibre qualité/taille)
- **Sizes responsive** : optimisé pour chaque breakpoint

---

## 📁 **Structure des dossiers**

```
public/
├── images/
│   ├── projects/           # Images de projets
│   │   ├── project1-desktop.jpg
│   │   ├── project1-mobile.jpg
│   │   ├── project2-desktop.jpg
│   │   └── project2-mobile.jpg
│   ├── hero/              # Images hero/banner
│   ├── about/             # Images de la section about
│   └── misc/              # Images diverses
```

---

## 🚀 **Utilisation du composant Image**

### **Exemple basique**

```tsx
import Image from "@/app/Image";

<Image
  src="/images/project-desktop.jpg"
  alt="Description de l'image"
  width={400}
  height={300}
/>;
```

### **Avec images responsives**

```tsx
<Image
  src="/images/project-desktop.jpg"
  mobileSrc="/images/project-mobile.jpg"
  desktopSrc="/images/project-desktop.jpg"
  alt="Projet responsive"
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### **Avec lazy loading et placeholder**

```tsx
<Image
  src="/images/project.jpg"
  alt="Projet avec placeholder"
  width={400}
  height={300}
  priority={false} // Lazy loading activé
  quality={85}
  placeholder="empty"
/>
```

### **Avec interaction**

```tsx
<Image
  src="/images/project.jpg"
  alt="Projet cliquable"
  width={400}
  height={300}
  onClick={() => openModal()}
  className="clickable"
/>
```

---

## 🆕 **Nouvelle structure d'image imbriquée**

### **Structure JSON optimisée**

```json
{
  "image": {
    "src": {
      "mobile": "/images/project-mobile.jpg",
      "desktop": "/images/project-desktop.jpg"
    },
    "alt": "Description de l'image",
    "width": 400,
    "height": 300,
    "quality": 85,
    "priority": false
  }
}
```

### **Utilisation avec ResponsiveImage**

```tsx
import ResponsiveImage from "@/components/ResponsiveImage";

<ResponsiveImage
  {...imageConfig}
  className="custom-class"
  onClick={handleClick}
  sizes="(max-width: 768px) 100vw, 50vw"
/>;
```

### **Types TypeScript**

```typescript
interface ResponsiveImage {
  src: {
    mobile: string;
    desktop: string;
  };
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
}
```

---

## 🎨 **Variantes CSS disponibles**

### **Tailles prédéfinies**

```scss
.small    // 200x150px
.medium   // 300x225px
.large    // 400x300px
.fullWidth // 100% width, aspect-ratio 16:9
```

### **Formes**

```scss
.rounded  // border-radius: 12px
.circular // border-radius: 50%, aspect-ratio: 1
```

### **Effets**

```scss
.withShadow // Ombre portée
.withBorder // Bordure
```

---

## 📱 **Images responsives**

### **Recommandations de tailles**

| Type   | Desktop     | Mobile    | Format   |
| ------ | ----------- | --------- | -------- |
| Projet | 800x600px   | 400x300px | JPG/WebP |
| Hero   | 1920x1080px | 768x432px | JPG/WebP |
| Avatar | 200x200px   | 150x150px | JPG/PNG  |
| Logo   | 300x100px   | 200x67px  | PNG/SVG  |

### **Naming convention**

```
project-name-desktop.jpg
project-name-mobile.jpg
project-name-thumbnail.jpg
```

---

## ⚡ **Optimisation des performances**

### **1. Formats recommandés**

- **WebP** : Meilleur rapport qualité/taille
- **AVIF** : Encore mieux, support limité
- **JPG** : Fallback universel
- **PNG** : Pour les images avec transparence

### **2. Tailles recommandées**

- **Desktop** : 800px de large max
- **Mobile** : 400px de large max
- **Thumbnail** : 200px de large max

### **3. Qualité**

- **Photos** : 85-90%
- **Screenshots** : 80-85%
- **Logos** : 100% (PNG)

---

## 🔧 **Configuration Next.js**

Le projet est configuré pour optimiser automatiquement les images :

```typescript
// next.config.ts
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

---

## 📊 **Monitoring des performances**

### **Outils recommandés**

- **Lighthouse** : Audit complet des images
- **WebPageTest** : Analyse des temps de chargement
- **Chrome DevTools** : Network tab pour voir les images

### **Métriques à surveiller**

- **Largest Contentful Paint (LCP)** : < 2.5s
- **Cumulative Layout Shift (CLS)** : < 0.1
- **First Input Delay (FID)** : < 100ms

---

## 🎯 **Exemple complet : ProjectCard**

Le composant `ProjectCard` utilise la nouvelle structure d'image :

```json
{
  "id": "project-card-example",
  "type": "ProjectCard",
  "title": "Portfolio Interactif",
  "description": "Un portfolio moderne avec scroll interactif...",
  "image": {
    "src": {
      "mobile": "/images/projects/portfolio-mobile.jpg",
      "desktop": "/images/projects/portfolio-desktop.jpg"
    },
    "alt": "Screenshot du portfolio interactif"
  },
  "technologies": ["React", "Next.js", "TypeScript"],
  "link": "https://github.com/reda-dev/portfolio"
}
```

```tsx
<ResponsiveImage
  {...image}
  width={400}
  height={300}
  className={styles.projectImage}
  onClick={handleImageClick}
  priority={false}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**Avantages :**

- ✅ **Structure claire** : Image configurée en une seule place
- ✅ **Responsive** : Images adaptées mobile/desktop
- ✅ **Lazy loading** : Chargement optimisé
- ✅ **Interactif** : Clic pour ouvrir le projet
- ✅ **Accessible** : Alt text descriptif
- ✅ **Performance** : Sizes optimisés

---

## 🚀 **Prochaines étapes**

1. **Ajoutez vos images** dans `public/images/`
2. **Optimisez les tailles** selon les recommandations
3. **Utilisez la nouvelle structure** JSON pour vos composants
4. **Testez** avec Lighthouse
5. **Surveillez** les performances en production

Vos images sont maintenant optimisées avec une structure claire et performante ! 🎉
