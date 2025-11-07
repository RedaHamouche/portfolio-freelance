# Portfolio Freelance - Cahier des Charges & Fonctionnalités

## 📋 Vue d'ensemble

Ce portfolio présente une **expérience de navigation révolutionnaire** où le contenu se déplace le long d'un chemin SVG personnalisable, au lieu d'un scroll vertical traditionnel. L'utilisateur navigue le long d'une trajectoire visuelle, créant une expérience immersive et mémorable.

---

## 🎯 Concept Principal

### Navigation le long d'un Path SVG

Le portfolio utilise un **chemin SVG (path)** comme élément central de navigation. Au lieu de scroller verticalement, l'utilisateur suit une trajectoire visuelle qui peut prendre n'importe quelle forme (courbe, ligne, spirale, etc.).

**Avantages** :

- ✅ Expérience unique et mémorable
- ✅ Navigation fluide et naturelle
- ✅ Possibilité de créer des parcours narratifs
- ✅ Adaptable à différents styles visuels

---

## 🎮 Fonctionnalités de Navigation

### 1. Scroll Manuel

**Description** : L'utilisateur peut naviguer manuellement le long du path en utilisant les contrôles natifs de son appareil.

**Contrôles** :

- **Desktop** : Molette de souris, trackpad
- **Mobile** : Gestes tactiles (swipe haut/bas)

**Comportement** :

- Le scroll suit la direction du path (forward/backward)
- Navigation infinie : boucle automatique (0 ↔ 1)
- Inertie naturelle : le mouvement continue légèrement après l'arrêt
- Détection automatique de la direction

**Expérience** :

- Fluide et réactif
- Sensation naturelle de mouvement
- Pas de saccades ni de lag

---

### 2. Autoplay (Défilement Automatique)

**Description** : Le portfolio peut défiler automatiquement le long du path, comme une visite guidée.

**Contrôles** :

- **Bouton Play/Pause** : Démarrer ou arrêter l'autoplay
- **Bouton Direction** : Changer le sens de défilement (avant/arrière)

**Comportement** :

- Défilement automatique à vitesse constante
- **Ralentissement intelligent** : Ralentit progressivement à l'approche des composants
- **Accélération** : Reprend de la vitesse après avoir passé un composant
- **Pauses automatiques** : S'arrête automatiquement sur certains éléments (configurables)
- **Vitesses différentes** : Mobile et desktop ont des vitesses adaptées

**Expérience** :

- Visite guidée fluide
- Permet de découvrir le contenu sans interaction
- L'utilisateur peut reprendre le contrôle à tout moment

---

### 3. Navigation par Clic

**Description** : L'utilisateur peut cliquer sur le PointTrail (indicateur de navigation) pour sauter directement au prochain élément.

**Comportement** :

- Clic sur le PointTrail → Scroll automatique vers le prochain composant
- Respecte la direction indiquée par le PointTrail
- Animation fluide (smooth scroll)
- Annule automatiquement l'autoplay si actif

**Expérience** :

- Navigation rapide et précise
- Contrôle total sur le parcours
- Interface intuitive

---

## 🎨 Éléments Visuels

### PointTrail (Indicateur de Navigation)

**Description** : Un indicateur visuel qui suit le path et indique la direction et le prochain élément.

**Fonctionnalités** :

- Suit le path en temps réel
- Affiche le nom du prochain composant
- Indique la direction (flèche gauche/droite)
- Cliquable pour navigation rapide
- Rotation automatique pour rester lisible

**Position** : Toujours visible, suit le progress actuel

---

### Composants Positionnés

**Description** : Tous les éléments de contenu (projets, textes, images) sont positionnés dynamiquement le long du path.

**Fonctionnalités** :

- Positionnement automatique selon le progress
- Responsive : positions adaptées mobile/desktop
- Animations au passage (configurables)
- Visibilité optimisée selon l'angle du path

---

### TextOnPath (Texte sur le Path)

**Description** : Texte qui suit la courbe du path SVG, créant un effet visuel unique.

**Fonctionnalités** :

- Chaque lettre positionnée individuellement
- Rotation automatique pour suivre la courbe
- Normalisation pour rester lisible
- Utilisable pour les titres de sections

---

## 📱 Responsive Design

### Adaptation Mobile/Desktop

**Desktop** :

- Path plus large et détaillé
- Plus d'éléments visibles simultanément
- Vitesse d'autoplay plus rapide
- Contrôles optimisés pour souris/trackpad

**Mobile** :

- Path simplifié et optimisé
- Moins d'éléments pour la performance
- Vitesse d'autoplay plus lente
- Contrôles optimisés pour le tactile
- Gestion spéciale du viewport iOS Safari

---

## 🔧 Fonctionnalités Techniques

### Persistance de la Position

**Description** : Le portfolio se souvient de la position de scroll de l'utilisateur.

**Comportement** :

- Sauvegarde automatique dans localStorage
- Restauration au rechargement de la page
- Priorité : Hash URL > localStorage > Position par défaut

**Avantages** :

- L'utilisateur reprend où il s'est arrêté
- Partage de liens directs vers des sections

---

### Deep Linking (Anchors)

**Description** : Chaque composant peut avoir un identifiant unique (anchorId) pour un accès direct.

**Comportement** :

- URL avec hash : `#mon-projet`
- Mise à jour automatique de l'URL lors du scroll
- Navigation directe vers un composant via l'URL
- Synchronisation bidirectionnelle (URL ↔ Scroll)

**Avantages** :

- Partage de liens vers des projets spécifiques
- Navigation directe depuis un bookmark
- SEO amélioré

---

### Gestion des Modals

**Description** : Les modals (fenêtres popup) bloquent automatiquement le scroll pour éviter les conflits.

**Comportement** :

- Ouverture de modal → Scroll bloqué
- Fermeture de modal → Scroll restauré
- Autoplay automatiquement mis en pause
- Position de scroll préservée

---

## 🎯 Sections Principales

Le portfolio est organisé en **3 sections principales** :

### 1. Works (Projets)

**Description** : Présentation des projets réalisés.

**Fonctionnalités** :

- Liste de projets positionnés le long du path
- Cartes de projets avec images, descriptions, tags
- Modals pour les détails complets
- Navigation fluide entre les projets

**Position** : Première section (progress ~0.0 - 0.33)

---

### 2. About (À Propos)

**Description** : Présentation personnelle et parcours.

**Fonctionnalités** :

- Contenu textuel et visuel
- Informations sur le parcours
- Compétences et expériences
- Éléments interactifs possibles

**Position** : Deuxième section (progress ~0.33 - 0.66)

---

### 3. Contact

**Description** : Formulaire de contact et informations.

**Fonctionnalités** :

- Formulaire de contact
- Informations de contact
- Liens sociaux
- Call-to-action

**Position** : Troisième section (progress ~0.66 - 1.0)

---

## 🎨 Expérience Utilisateur

### Transitions et Animations

**Easing Intelligent** :

- Ralentissement progressif à l'approche des composants
- Accélération après avoir passé un composant
- Courbes d'animation fluides (ease-in, ease-out)
- Vitesse adaptative selon le contexte

**Animations** :

- Transitions GPU-accélérées (GSAP)
- Pas de lag ni de saccades
- 60fps constant
- Optimisé pour la performance

---

### Feedback Visuel

**Indicateurs** :

- PointTrail montre toujours la direction
- Changement de couleur du path (optionnel)
- Animations au passage des composants
- États visuels (hover, active, etc.)

---

## ⚙️ Configuration

### Vitesses d'Autoplay

**Mobile** : 0.6 (60% de la vitesse de base)
**Desktop** : 0.8 (80% de la vitesse de base)

**Personnalisable** dans `src/config/index.ts`

---

### Easing (Ralentissement/Accélération)

**Paramètres** :

- **Distance d'approche** : 5% du path (commence à ralentir)
- **Vitesse minimale** : 30% de la vitesse normale
- **Distance d'accélération** : 3% du path (après le composant)
- **Vitesse maximale** : 150% de la vitesse normale

**Personnalisable** dans `src/config/index.ts`

---

### Inertie du Scroll Manuel

**Paramètres** :

- **Facteur d'inertie** : 0.06 (force du mouvement continu)
- **Type d'easing** : easeOut (courbe de décélération)
- **Seuil minimum** : 0.0001 (arrêt de l'animation)

**Personnalisable** dans `src/config/index.ts`

---

## 🎯 Cas d'Usage

### Cas 1 : Découverte Automatique

**Scénario** : L'utilisateur arrive sur le site et clique sur "Play".

**Comportement** :

1. L'autoplay démarre automatiquement
2. Le portfolio défile le long du path
3. Ralentit à l'approche de chaque projet
4. Pause automatique sur les projets importants
5. L'utilisateur peut reprendre le contrôle à tout moment

**Résultat** : Découverte passive et guidée du contenu

---

### Cas 2 : Navigation Manuelle

**Scénario** : L'utilisateur veut explorer à son rythme.

**Comportement** :

1. Scroll manuel avec molette/trackpad
2. Navigation fluide avec inertie
3. Le PointTrail indique toujours la direction
4. Possibilité de cliquer pour sauter au prochain élément

**Résultat** : Contrôle total et navigation personnalisée

---

### Cas 3 : Accès Direct

**Scénario** : L'utilisateur clique sur un lien partagé `#mon-projet`.

**Comportement** :

1. Le portfolio charge directement à la position du projet
2. Scroll automatique vers le projet (smooth)
3. Le projet est immédiatement visible
4. Navigation normale disponible depuis cette position

**Résultat** : Accès instantané au contenu souhaité

---

## 🔄 Boucle Infinie

**Description** : Le path est circulaire, permettant une navigation infinie.

**Comportement** :

- Progress 0.0 → 1.0 → 0.0 (boucle)
- Transition fluide sans saut
- Navigation continue dans les deux sens
- Pas de "fin" du parcours

**Avantages** :

- Expérience immersive
- Navigation naturelle
- Pas de point d'arrêt

---

## 📊 Performance

### Optimisations Implémentées

**Rendu** :

- GPU-accélération pour les transformations
- Memoization des calculs coûteux
- Lazy loading des images
- Cache des positions sur le path

**Scroll** :

- RequestAnimationFrame pour 60fps
- Throttling des mises à jour
- Calculs optimisés (recherche binaire)
- Pas de re-renders inutiles

**Résultat** : Expérience fluide même avec beaucoup de contenu

---

## 🎯 Objectifs UX

### 1. Immersion

L'utilisateur doit se sentir "dans" le portfolio, pas simplement en train de le consulter.

### 2. Fluidité

Toutes les interactions doivent être fluides, sans lag ni saccades.

### 3. Intuitivité

La navigation doit être naturelle, sans nécessiter d'explications.

### 4. Contrôle

L'utilisateur doit toujours avoir le contrôle, même pendant l'autoplay.

### 5. Découverte

Le portfolio doit encourager l'exploration et la découverte du contenu.

---

## 🚀 Évolutions Futures Possibles

### Fonctionnalités Potentielles

1. **Mini-map** : Vue d'ensemble du path avec position actuelle
2. **Sections thématiques** : Changement visuel du path selon la section
3. **Transitions animées** : Effets visuels entre sections
4. **Mode sombre/clair** : Thème adaptable
5. **Personnalisation** : Choix du style de path par l'utilisateur

---

## 📝 Notes Techniques pour Développeurs

### Architecture

- **DDD (Domain-Driven Design)** : Séparation claire des responsabilités
- **TDD (Test-Driven Development)** : Tests Gherkin pour les cas d'usage
- **Redux Toolkit** : Gestion d'état centralisée
- **GSAP** : Animations performantes
- **Next.js** : Framework React avec SSR

### Structure des Données

Les composants sont définis dans des fichiers JSON :

- `src/templating/config/components-desktop.json`
- `src/templating/config/components-mobile.json`

Chaque composant a :

- `id` : Identifiant unique
- `type` : Type de composant (ProjectCard, TextOnPath, etc.)
- `position.progress` : Position sur le path (0-1)
- `anchorId` : Identifiant pour le deep linking (optionnel)
- `autoScrollPauseTime` : Durée de pause si autoplay (optionnel)

---

## 🎨 Personnalisation Visuelle

### Modifier le Path SVG

Le path SVG est défini dans :

- `src/templating/config/path-desktop.json`
- `src/templating/config/path-mobile.json`

**Format** : Attribut `d` d'un path SVG standard

**Exemple** :

```json
{
  "pathD": "M 100 100 Q 200 200 300 100 T 500 100"
}
```

### Ajouter des Composants

1. Créer le composant React dans `src/components/`
2. L'ajouter au mapping dans `src/templating/mappingComponent.ts`
3. L'ajouter dans le JSON de configuration avec sa position

---

## ✅ Checklist Fonctionnalités

### Navigation

- [x] Scroll manuel (wheel, touch)
- [x] Autoplay avec contrôle play/pause
- [x] Changement de direction
- [x] Navigation par clic sur PointTrail
- [x] Deep linking (hash dans URL)
- [x] Persistance de la position

### Expérience

- [x] Easing intelligent (ralentissement/accélération)
- [x] Inertie naturelle
- [x] Boucle infinie
- [x] Transitions fluides
- [x] Responsive mobile/desktop

### Technique

- [x] Performance optimisée
- [x] Gestion des conflits
- [x] Protection contre les race conditions
- [x] Support cross-browser
- [x] Tests automatisés

---

## 📞 Support

Pour toute question sur le fonctionnement ou la personnalisation, consulter :

- `docs/SCROLL_SYSTEM_SUMMARY.md` : Documentation technique complète
- `docs/AUTOPLAY.md` : Documentation de l'autoplay
- `docs/SCROLL_USE_CASES.md` : Cas d'usage détaillés

---
