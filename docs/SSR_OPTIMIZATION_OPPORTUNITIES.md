# Opportunités d'Optimisation SSR/SSG avec Next.js

**Date** : Analyse complète des opportunités SSR/SSG  
**Objectif** : Identifier les endroits où le Server-Side Rendering et Static Site Generation peuvent améliorer les performances

---

## 📊 Vue d'Ensemble

Le projet utilise actuellement **Next.js 14 avec App Router**, mais la plupart des composants sont en `"use client"`, ce qui signifie que tout est rendu côté client. Il existe plusieurs opportunités d'optimisation en tirant parti du SSR/SSG de Next.js.

---

## 🎯 Opportunités Identifiées

### 1. ⚡ Pré-chargement des Configurations JSON (Priorité 🔴 Haute)

**Problème actuel** :
- Les fichiers JSON (`page.json`, `path.json`, `pathTangente.json`) sont importés statiquement mais chargés côté client
- Les index (Maps) sont construits côté client à chaque chargement
- Les caches sont initialisés côté client

**Fichiers concernés** :
- `src/templating/domains/path/repository.ts`
- `src/templating/domains/page/repository.ts`
- `src/templating/domains/tangente/repository.ts`

**Solution SSR** :
```typescript
// src/app/page.tsx
import { getServerSideProps } from 'next';

export async function getServerSideProps() {
  // Pré-charger les configs côté serveur
  const pathConfigDesktop = await import('@/templating/config/desktop/path.json');
  const pathConfigMobile = await import('@/templating/config/mobile/path.json');
  
  // Pré-construire les index côté serveur
  const desktopIndexes = buildIndexes(pathConfigDesktop.default);
  const mobileIndexes = buildIndexes(pathConfigMobile.default);
  
  return {
    props: {
      pathConfigDesktop: pathConfigDesktop.default,
      pathConfigMobile: pathConfigMobile.default,
      desktopIndexes: serializeIndexes(desktopIndexes),
      mobileIndexes: serializeIndexes(mobileIndexes),
    },
  };
}
```

**Gain estimé** :
- ⚡ **-200-500ms** sur le First Contentful Paint (FCP)
- ⚡ **-100-300ms** sur le Time to Interactive (TTI)
- ✅ Les index sont prêts immédiatement, pas de construction côté client

**Impact** : 🔴 **Haute priorité** - Amélioration significative du temps de chargement initial

---

### 2. 🎨 Pré-calcul du Progress Initial (Priorité 🔴 Haute)

**Problème actuel** :
- Le progress initial est calculé côté client dans `useScrollInitialization`
- Lecture de `localStorage` et parsing du hash côté client
- `window.scrollTo()` appelé après le rendu client

**Fichiers concernés** :
- `src/components/app/MapScroller/hooks/useScrollInitialization/index.ts`
- `src/components/app/MapScroller/hooks/useScrollInitialization/domain/ProgressInitializationService/index.ts`

**Solution SSR** :
```typescript
// src/app/page.tsx
export async function getServerSideProps(context) {
  const hash = context.req.url?.split('#')[1] || null;
  
  // Pré-calculer le progress initial côté serveur
  let initialProgress = 0.005; // default
  let progressSource = 'default';
  
  // 1. Vérifier le hash (si présent)
  if (hash) {
    const hashProgress = getProgressFromHash(hash, pathDomain, isDesktop);
    if (hashProgress !== null) {
      initialProgress = hashProgress;
      progressSource = 'hash';
    }
  }
  
  // 2. Note: localStorage n'est pas accessible côté serveur
  //    Mais on peut pré-calculer le scrollY correspondant
  
  const scrollY = calculateScrollY(initialProgress, globalPathLength);
  
  return {
    props: {
      initialProgress,
      initialScrollY: scrollY,
      progressSource,
    },
  };
}
```

**Gain estimé** :
- ⚡ **-100-200ms** sur le Layout Shift (CLS)
- ⚡ **-50-150ms** sur le First Paint
- ✅ Pas de flash de contenu, position initiale correcte immédiatement

**Impact** : 🔴 **Haute priorité** - Amélioration de l'expérience utilisateur (pas de saut de scroll)

---

### 3. 📱 Détection du Device Côté Serveur (Priorité 🟡 Moyenne)

**Problème actuel** :
- `window.innerWidth` utilisé pour détecter desktop/mobile
- Calculé côté client après le rendu
- Peut causer un flash de contenu (FOUC - Flash of Unstyled Content)

**Fichiers concernés** :
- `src/config/index.ts` (fonction `getConfig()`)
- `src/hooks/useResponsivePath/index.ts`
- `src/components/commons/Image/index.tsx`

**Solution SSR** :
```typescript
// src/app/page.tsx
export async function getServerSideProps(context) {
  // Utiliser les headers HTTP pour détecter le device
  const userAgent = context.req.headers['user-agent'] || '';
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  
  // Ou utiliser les headers Next.js
  const viewport = context.req.headers['viewport-width'];
  
  return {
    props: {
      isDesktop: !isMobile,
      initialViewport: viewport || 'desktop',
    },
  };
}
```

**Alternative avec Middleware** :
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  
  // Ajouter un header personnalisé
  const response = NextResponse.next();
  response.headers.set('x-device-type', isMobile ? 'mobile' : 'desktop');
  
  return response;
}
```

**Gain estimé** :
- ⚡ **-50-100ms** sur le FCP (pas de recalcul côté client)
- ✅ Pas de FOUC (Flash of Unstyled Content)
- ✅ Contenu adapté immédiatement

**Impact** : 🟡 **Moyenne priorité** - Amélioration de l'expérience utilisateur

---

### 4. 🖼️ Optimisation des Images avec Placeholders Blur (Priorité 🟡 Moyenne)

**Problème actuel** :
- Les images utilisent `NextImage` mais sans placeholder blur
- Lazy loading avec Intersection Observer (côté client uniquement)
- Pas de pré-chargement des images critiques

**Fichiers concernés** :
- `src/components/commons/Image/index.tsx`
- `src/components/templatingComponents/path/ResponsiveImage/index.tsx`

**Solution SSR** :
```typescript
// Générer des placeholders blur côté serveur
import { getPlaiceholder } from 'plaiceholder';

export async function getServerSideProps() {
  // Pour les images critiques (hero, première image)
  const imagePath = '/images/hero.jpg';
  const { base64, img } = await getPlaiceholder(imagePath);
  
  return {
    props: {
      heroImage: {
        ...img,
        blurDataURL: base64,
      },
    },
  };
}
```

**Utilisation** :
```tsx
<NextImage
  src={heroImage.src}
  width={heroImage.width}
  height={heroImage.height}
  placeholder="blur"
  blurDataURL={heroImage.blurDataURL}
  priority // Pour les images above-the-fold
/>
```

**Gain estimé** :
- ⚡ **-200-400ms** sur le Largest Contentful Paint (LCP)
- ✅ Meilleure perception de performance (placeholder visible immédiatement)
- ✅ Pas de layout shift

**Impact** : 🟡 **Moyenne priorité** - Amélioration du LCP (Core Web Vital)

---

### 5. 📄 Métadonnées Dynamiques et SEO (Priorité 🟡 Moyenne)

**Problème actuel** :
- Métadonnées basiques dans `layout.tsx`
- Pas de métadonnées dynamiques basées sur le contenu
- Pas d'Open Graph ou Twitter Cards

**Fichiers concernés** :
- `src/app/layout.tsx`
- `src/app/page.tsx`

**Solution SSR** :
```typescript
// src/app/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  // Charger les données depuis les configs
  const pageConfig = await import('@/templating/config/desktop/page.json');
  
  return {
    title: pageConfig.default.title || 'Portfolio Freelance',
    description: pageConfig.default.description || 'Portfolio professionnel',
    openGraph: {
      title: pageConfig.default.title,
      description: pageConfig.default.description,
      images: [pageConfig.default.ogImage || '/og-image.jpg'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageConfig.default.title,
      description: pageConfig.default.description,
      images: [pageConfig.default.twitterImage || '/twitter-image.jpg'],
    },
  };
}
```

**Gain estimé** :
- ✅ Meilleur référencement SEO
- ✅ Meilleur partage sur les réseaux sociaux
- ✅ Rich snippets dans les résultats de recherche

**Impact** : 🟡 **Moyenne priorité** - Amélioration du SEO et du partage social

---

### 6. 🎯 Pré-calcul du Path Length (Priorité 🟢 Faible)

**Problème actuel** :
- `svgPath.getTotalLength()` appelé côté client
- Calculé après le rendu du SVG
- Peut causer un léger délai

**Fichiers concernés** :
- `src/components/app/MapScroller/components/MapViewport/index.tsx`
- `src/utils/pathCalculations/index.ts`

**Solution SSR** :
```typescript
// Si le path SVG est statique, on peut pré-calculer sa longueur
// Mais attention : le path peut être responsive (desktop/mobile différents)

// Option 1: Pré-calculer pour desktop et mobile
export async function getServerSideProps() {
  // Charger le SVG path
  const svgPathDesktop = await loadSvgPath('desktop');
  const svgPathMobile = await loadSvgPath('mobile');
  
  // Calculer les longueurs (nécessite un parser SVG côté serveur)
  const pathLengthDesktop = calculatePathLength(svgPathDesktop);
  const pathLengthMobile = calculatePathLength(svgPathMobile);
  
  return {
    props: {
      pathLengthDesktop,
      pathLengthMobile,
    },
  };
}
```

**Note** : Cette optimisation est **complexe** car :
- Le path SVG peut être responsive
- Nécessite un parser SVG côté serveur (ex: `svg-path-properties`)
- Le gain est minime (calcul très rapide côté client)

**Gain estimé** :
- ⚡ **-10-50ms** sur le rendu initial
- ⚠️ Complexité élevée pour un gain faible

**Impact** : 🟢 **Faible priorité** - Gain minimal, complexité élevée

---

### 7. 🔄 Static Site Generation (SSG) pour Contenu Statique (Priorité 🟢 Faible)

**Problème actuel** :
- Tout est rendu côté client
- Les configurations JSON sont statiques mais chargées côté client

**Solution SSG** :
```typescript
// src/app/page.tsx
export async function generateStaticParams() {
  // Si le contenu est vraiment statique, on peut pré-rendre
  return [
    { slug: 'home' },
  ];
}

export async function generateStaticProps() {
  // Pré-charger toutes les configs
  const [pageConfig, pathConfig, tangenteConfig] = await Promise.all([
    import('@/templating/config/desktop/page.json'),
    import('@/templating/config/desktop/path.json'),
    import('@/templating/config/desktop/pathTangente.json'),
  ]);
  
  return {
    props: {
      pageConfig: pageConfig.default,
      pathConfig: pathConfig.default,
      tangenteConfig: tangenteConfig.default,
    },
    revalidate: 3600, // Re-générer toutes les heures
  };
}
```

**Note** : Cette optimisation est **limitée** car :
- Le projet utilise beaucoup d'interactivité côté client (scroll, animations)
- Les configurations peuvent changer fréquemment
- Le localStorage et hash nécessitent du rendu côté client

**Gain estimé** :
- ⚡ **-300-500ms** sur le First Load (si le contenu est vraiment statique)
- ⚠️ Limité par l'interactivité côté client

**Impact** : 🟢 **Faible priorité** - Gain limité par l'architecture actuelle

---

## 📋 Plan d'Implémentation Recommandé

### Phase 1 : Optimisations Haute Priorité (🔴)

1. **Pré-chargement des Configurations JSON**
   - Créer un helper `getServerSideConfigs()` pour charger les configs
   - Pré-construire les index côté serveur
   - Passer les configs via props

2. **Pré-calcul du Progress Initial**
   - Extraire la logique de `ProgressInitializationService` pour le serveur
   - Pré-calculer le progress et scrollY côté serveur
   - Utiliser `window.scrollTo()` côté client avec les valeurs pré-calculées

**Temps estimé** : 4-6 heures  
**Gain estimé** : **-300-700ms** sur le FCP et TTI

---

### Phase 2 : Optimisations Moyenne Priorité (🟡)

3. **Détection du Device Côté Serveur**
   - Créer un middleware pour détecter mobile/desktop
   - Passer `isDesktop` via props
   - Éliminer les calculs `window.innerWidth` côté client

4. **Optimisation des Images**
   - Ajouter `plaiceholder` pour générer des placeholders blur
   - Marquer les images critiques avec `priority`
   - Pré-générer les placeholders au build time

5. **Métadonnées Dynamiques**
   - Créer `generateMetadata()` dans `page.tsx`
   - Ajouter Open Graph et Twitter Cards
   - Utiliser les données des configs JSON

**Temps estimé** : 6-8 heures  
**Gain estimé** : **-250-500ms** sur le LCP, meilleur SEO

---

### Phase 3 : Optimisations Faible Priorité (🟢)

6. **Pré-calcul du Path Length** (si vraiment nécessaire)
7. **Static Site Generation** (si le contenu devient vraiment statique)

**Temps estimé** : 4-6 heures  
**Gain estimé** : **-50-200ms** (gain limité)

---

## ⚠️ Considérations Importantes

### Limitations du SSR pour ce Projet

1. **Interactivité Côté Client** :
   - Le projet utilise beaucoup d'interactivité (scroll, animations GSAP)
   - Le localStorage et hash nécessitent du rendu côté client
   - Les événements utilisateur (wheel, touch) nécessitent le client

2. **Hydration** :
   - Après le SSR, React doit "hydrater" le composant côté client
   - Si le HTML SSR diffère du HTML client, cela peut causer des warnings
   - Nécessite une attention particulière aux composants interactifs

3. **Complexité** :
   - Ajouter du SSR augmente la complexité du code
   - Nécessite de gérer les différences serveur/client
   - Tests plus complexes (nécessitent de tester SSR et client)

### Recommandation

**Prioriser les optimisations Phase 1 et Phase 2** :
- ✅ Gain significatif sur les performances
- ✅ Complexité raisonnable
- ✅ Impact utilisateur visible

**Éviter Phase 3** (pour l'instant) :
- ⚠️ Gain limité
- ⚠️ Complexité élevée
- ⚠️ Maintenance supplémentaire

---

## 📊 Métriques Attendues

### Avant Optimisations
- **FCP** : ~1.5-2.5s
- **TTI** : ~2.5-3.5s
- **LCP** : ~2.5-4s
- **CLS** : ~0.1-0.2 (saut de scroll)

### Après Optimisations Phase 1 + 2
- **FCP** : ~1.0-1.5s (-500ms)
- **TTI** : ~2.0-2.5s (-500ms)
- **LCP** : ~2.0-3.0s (-500ms)
- **CLS** : ~0.0-0.05 (pas de saut)

**Amélioration globale estimée** : **-20-30%** sur les métriques de performance

---

## 🚀 Prochaines Étapes

1. ✅ **Analyser les opportunités** (ce document)
2. ⏳ **Implémenter Phase 1** (haute priorité)
3. ⏳ **Mesurer les gains** (Lighthouse, WebPageTest)
4. ⏳ **Implémenter Phase 2** (moyenne priorité)
5. ⏳ **Optimiser selon les résultats**

---

## 📚 Ressources

- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Next.js Metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Plaiceholder](https://plaiceholder.co/) - Génération de placeholders blur
- [Web Vitals](https://web.dev/vitals/) - Métriques de performance

---

**Note** : Ces optimisations sont **complémentaires** aux optimisations déjà implémentées (cache LRU, recherche binaire, etc.). Elles se concentrent sur le **temps de chargement initial** plutôt que sur les **performances runtime**.

