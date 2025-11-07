# Portfolio Freelance - Navigation Innovante

Un portfolio moderne avec une navigation révolutionnaire basée sur un **scroll le long d'un chemin SVG**. L'expérience utilisateur est fluide, immersive et unique.

## 🎯 Concept

Ce portfolio propose une expérience de navigation innovante où le contenu se déplace le long d'un **path SVG personnalisable**. Au lieu d'un scroll vertical traditionnel, l'utilisateur navigue le long d'une trajectoire visuelle, créant une expérience immersive et mémorable.

## ✨ Fonctionnalités Principales

### 🗺️ Navigation le long d'un Path SVG

- **Scroll circulaire** : Navigation infinie le long d'un chemin SVG (wraparound 0 ↔ 1)
- **PointTrail** : Indicateur visuel qui suit le path et indique la direction
- **Composants positionnés** : Tous les éléments sont positionnés dynamiquement le long du path
- **TextOnPath** : Texte qui suit la courbe du path SVG

### 🎮 Modes de Navigation

1. **Scroll Manuel**

   - Molette de souris / Trackpad (desktop)
   - Gestes tactiles (mobile)
   - Inertie et easing personnalisables
   - Détection automatique de la direction

2. **Autoplay**

   - Défilement automatique avec pauses aux points d'intérêt
   - Vitesses différentes pour mobile et desktop
   - Easing intelligent : ralentit à l'approche des composants, accélère après
   - Contrôle play/pause et changement de direction

3. **Navigation par Clic**
   - Clic sur le PointTrail pour sauter au prochain composant
   - Navigation directe via les anchors (hash dans l'URL)

### 🎨 Expérience Utilisateur

- **Easing intelligent** : Ralentissement progressif à l'approche des composants
- **Accélération** : Reprise de vitesse après avoir passé un composant
- **Transitions fluides** : Animations GPU-accélérées avec GSAP
- **Responsive** : Adaptation automatique mobile/desktop
- **Persistance** : Sauvegarde de la position de scroll dans localStorage

### 🔧 Fonctionnalités Techniques

- **Architecture DDD** : Domain-Driven Design pour une maintenabilité optimale
- **TDD** : Test-Driven Development avec tests Gherkin
- **Performance optimisée** : RAF, memoization, lazy loading
- **Gestion des conflits** : Protection contre les race conditions
- **Cross-browser** : Support iOS Safari, Chrome, Firefox

## 🏗️ Architecture

### Structure du Projet

```
src/
├── app/
│   ├── MapScroller/          # Système de navigation principal
│   │   ├── hooks/
│   │   │   ├── useManualScrollSync/    # Scroll manuel
│   │   │   ├── useAutoPlay/            # Autoplay avec easing
│   │   │   └── useScrollInitialization/ # Initialisation
│   │   └── components/
│   │       └── MapViewport/            # Vue principale
│   └── PointTrail/            # Indicateur de navigation
├── templating/
│   ├── components/            # Composants dynamiques
│   ├── domains/               # Domaines métier (DDD)
│   └── config/                # Configuration JSON
├── config/                    # Configuration centralisée
└── utils/                     # Utilitaires (calculs path, scroll)
```

### Technologies

- **Next.js 14** (App Router)
- **React 18** avec hooks personnalisés
- **Redux Toolkit** pour la gestion d'état
- **GSAP** pour les animations
- **TypeScript** pour la sécurité de type
- **SCSS** pour le styling
- **Jest** + **React Testing Library** pour les tests

## 🚀 Démarrage Rapide

### Installation

```bash
yarn install
```

### Développement

```bash
yarn dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Build

```bash
yarn build
```

### Tests

```bash
yarn test
```

## 📖 Documentation

### Documentation Technique

- **[Système de Scroll](./docs/SCROLL_SYSTEM_SUMMARY.md)** : Vue d'ensemble complète du système de navigation
- **[Autoplay](./docs/AUTOPLAY.md)** : Documentation détaillée de l'autoplay
- **[Use Cases](./docs/SCROLL_USE_CASES.md)** : Cas d'usage en format Gherkin
- **[Edge Cases](./docs/EDGE_CASES.md)** : Gestion des cas limites

### Configuration

Toutes les configurations sont centralisées dans `src/config/index.ts` :

- **Vitesses d'autoscroll** : Mobile et desktop séparés
- **Easing** : Ralentissement et accélération
- **Inertie** : Force du mouvement continu
- **Breakpoints** : Responsive design

## 🎨 Personnalisation

### Modifier le Path SVG

Le path SVG est défini dans les fichiers de configuration :

- `src/templating/config/path-desktop.json`
- `src/templating/config/path-mobile.json`

### Ajouter des Composants

Les composants sont définis dans :

- `src/templating/config/components-desktop.json`
- `src/templating/config/components-mobile.json`

### Configuration de l'Autoplay

```typescript
// src/config/index.ts
export const AUTO_SCROLL_CONFIG = {
  mobile: { speed: 0.6 },
  desktop: { speed: 0.8 },
  easing: {
    enabled: true,
    approachDistance: 0.05, // Distance de ralentissement
    minSpeed: 0.3, // Vitesse minimale
    accelerationDistance: 0.03, // Distance d'accélération
    maxSpeed: 1.5, // Vitesse maximale
  },
};
```

## 🧪 Tests

Le projet utilise une approche **TDD (Test-Driven Development)** avec des tests Gherkin pour définir les comportements attendus.

### Structure des Tests

- **Tests unitaires** : Services de domaine isolés
- **Tests d'intégration** : Hooks et composants
- **Tests Gherkin** : Cas d'usage complets

## 🐛 Résolution de Problèmes

### Problèmes Connus et Solutions

- **Safari iOS** : Gestion spéciale du viewport et des événements touch
- **Performance** : Optimisations GPU, memoization, lazy loading
- **Race Conditions** : Protection via refs et vérifications d'état

Voir [Edge Cases](./docs/EDGE_CASES.md) pour plus de détails.

## 📝 License

Ce projet est privé et personnel.

## 🙏 Remerciements

- **GSAP** pour les animations fluides
- **Next.js** pour le framework
- **React** pour l'écosystème

---

**Note** : Ce portfolio est en développement actif. Les fonctionnalités peuvent évoluer.
