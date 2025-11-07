# Use Cases - Système de Scroll

## Format Gherkin

### Use Case 1: Scroll Manuel (Touch/Wheel)

```gherkin
Feature: Scroll Manuel
  En tant qu'utilisateur
  Je veux pouvoir scroller manuellement le long du path SVG
  Afin de naviguer dans le contenu à mon rythme

  Background:
    Étant donné que la page est chargée
    Et que le path SVG est initialisé
    Et que le progress initial est à 0.005 (0.5%)

  Scenario: Scroll manuel vers l'avant (touch)
    Étant donné que l'utilisateur est sur iPhone
    Quand l'utilisateur fait un geste de scroll vers le bas (touch)
    Alors scrollYRef est mis à jour immédiatement avec window.scrollY
    Et processScrollUpdate est appelé via RAF
    Et le progress est calculé depuis scrollY
    Et le progress est dispatché dans Redux
    Et le SVG se déplace le long du path
    Et le PointTrail se déplace avec le scroll
    Et la direction est mise à jour à "forward"
    Et l'autoplay est mis en pause si actif

  Scenario: Scroll manuel vers l'arrière (touch)
    Étant donné que l'utilisateur est sur iPhone
    Et que le progress actuel est à 0.5
    Quand l'utilisateur fait un geste de scroll vers le haut (touch)
    Alors scrollYRef est mis à jour immédiatement
    Et le progress diminue
    Et la direction est mise à jour à "backward"
    Et le SVG se déplace vers l'arrière
    Et le PointTrail pointe vers la gauche

  Scenario: Scroll manuel avec wheel (desktop)
    Étant donné que l'utilisateur est sur desktop
    Quand l'utilisateur utilise la molette de la souris pour scroller
    Alors handleUserInteraction est déclenché
    Et le progress est mis à jour
    Et le SVG se déplace

  Scenario: Scroll manuel avec easing et inertie
    Étant donné que l'utilisateur scroll manuellement
    Quand l'utilisateur arrête de scroller
    Alors la boucle d'easing démarre
    Et le progress continue de s'animer avec l'inertie
    Et le progress décélère progressivement selon la courbe d'easing
    Et l'animation s'arrête quand le delta est inférieur à SCROLL_EASING_MIN_DELTA
```

### Use Case 2: Autoplay

```gherkin
Feature: Autoplay
  En tant qu'utilisateur
  Je veux que le scroll se fasse automatiquement
  Afin de découvrir le contenu sans interaction

  Background:
    Étant donné que la page est chargée
    Et que le path SVG est initialisé

  Scenario: Démarrage de l'autoplay
    Étant donné que l'autoplay est désactivé
    Quand l'utilisateur clique sur le bouton "Play"
    Alors isAutoPlaying passe à true
    Et la boucle d'animation démarre
    Et le progress augmente automatiquement
    Et window.scrollTo est appelé pour synchroniser le scroll
    Et le SVG se déplace automatiquement
    Et le PointTrail se déplace avec l'autoplay
    Et la direction est mise à jour selon autoScrollDirection

  Scenario: Autoplay avec pause sur composant
    Étant donné que l'autoplay est actif
    Et que le progress approche d'un composant avec autoScrollPauseTime
    Quand le progress atteint la zone de l'anchor (progress ± ANCHOR_TOLERANCE)
    Alors l'autoplay se met en pause
    Et isAutoScrollTemporarilyPaused passe à true
    Et un timeout est programmé avec la durée de pause
    Et après la pause, l'autoplay reprend automatiquement
    Et le cooldown de 5 secondes empêche la redétection immédiate

  Scenario: Arrêt de l'autoplay
    Étant donné que l'autoplay est actif
    Quand l'utilisateur clique sur le bouton "Pause"
    Alors isAutoPlaying passe à false
    Et la boucle d'animation s'arrête
    Et le progress reste à sa position actuelle
    Et le scroll manuel redevient disponible

  Scenario: Autoplay avec vitesse différente mobile/desktop
    Étant donné que l'autoplay est actif
    Quand l'utilisateur est sur mobile
    Alors la vitesse utilisée est AUTO_SCROLL_CONFIG.mobile.speed
    Quand l'utilisateur est sur desktop
    Alors la vitesse utilisée est AUTO_SCROLL_CONFIG.desktop.speed
```

### Use Case 3: Transition Autoplay → Scroll Manuel

```gherkin
Feature: Transition Autoplay vers Scroll Manuel
  En tant qu'utilisateur
  Je veux pouvoir reprendre le contrôle manuellement pendant l'autoplay
  Afin de naviguer à ma guise

  Background:
    Étant donné que l'autoplay est actif
    Et que le progress est à 0.3

  Scenario: Reprise du contrôle pendant l'autoplay (touch)
    Quand l'utilisateur fait un geste de scroll (touch)
    Alors handleUserInteraction est déclenché
    Et isAutoPlayingRef.current est mis à false immédiatement
    Et setAutoPlaying(false) est dispatché
    Et l'autoplay s'arrête de manière fluide
    Et le scroll manuel prend le relais
    Et il n'y a pas de saccade ou de saut
    Et le progress continue de manière fluide

  Scenario: Reprise du contrôle pendant l'autoplay (wheel)
    Quand l'utilisateur utilise la molette de la souris
    Alors l'autoplay se met en pause
    Et le scroll manuel prend le relais
    Et la transition est fluide

  Scenario: Pas de cumul de vitesses
    Étant donné que l'autoplay est actif
    Et que le progress augmente automatiquement
    Quand l'utilisateur scroll manuellement
    Alors l'autoplay s'arrête immédiatement
    Et seule la vitesse du scroll manuel est appliquée
    Et il n'y a pas de cumul entre les deux vitesses
```

### Use Case 4: Interactions qui ne doivent pas cancel l'autoplay

```gherkin
Feature: Interactions qui ne cancel pas l'autoplay
  En tant qu'utilisateur
  Je veux que certaines interactions ne mettent pas en pause l'autoplay
  Afin de pouvoir interagir avec l'interface sans interrompre la navigation

  Background:
    Étant donné que l'autoplay est actif

  Scenario: Click sur PointTrail ne cancel pas l'autoplay
    Quand l'utilisateur clique sur le PointTrail
    Alors handleGoToNext est appelé
    Et window.scrollTo est appelé pour aller au composant suivant
    Et l'autoplay continue de fonctionner
    Et isAutoPlaying reste à true

  Scenario: Click sur bouton direction ne cancel pas l'autoplay
    Quand l'utilisateur clique sur le bouton "Direction"
    Alors autoScrollDirection est inversé
    Et lastScrollDirection est mis à jour
    Et l'autoplay continue dans la nouvelle direction
    Et isAutoPlaying reste à true

  Scenario: Touch sur élément interactif ne cancel pas l'autoplay
    Quand l'utilisateur touche un bouton
    Alors handleUserInteraction détecte que c'est un élément interactif
    Et l'autoplay n'est pas mis en pause
    Et isAutoPlaying reste à true
```

### Use Case 5: Initialisation au Reload

```gherkin
Feature: Initialisation au Reload
  En tant qu'utilisateur
  Je veux que la page se charge correctement après un reload
  Afin de reprendre où j'en étais

  Background:
    Étant donné que l'utilisateur recharge la page

  Scenario: Initialisation avec hash dans l'URL
    Étant donné que l'URL contient un hash (#anchorId)
    Quand la page se charge
    Alors useScrollInitialization détecte le hash
    Et le progress correspondant au hash est récupéré
    Et window.scrollTo est appelé pour aller à cette position
    Et le progress est dispatché dans Redux
    Et useManualScrollSync s'initialise avec ce progress
    Et le SVG est positionné correctement

  Scenario: Initialisation avec localStorage
    Étant donné que l'URL ne contient pas de hash
    Et que le localStorage contient un progress sauvegardé
    Quand la page se charge
    Alors useScrollInitialization récupère le progress du localStorage
    Et window.scrollTo est appelé
    Et le progress est dispatché dans Redux
    Et le SVG est positionné correctement

  Scenario: Initialisation par défaut
    Étant donné que l'URL ne contient pas de hash
    Et que le localStorage est vide
    Quand la page se charge
    Alors le progress par défaut (0.005) est utilisé
    Et window.scrollTo est appelé
    Et le SVG est positionné au début

  Scenario: Scroll manuel fonctionne après reload
    Étant donné que la page vient de se charger
    Et que useScrollInitialization a fini (isScrollSynced = true)
    Quand l'utilisateur scroll rapidement
    Alors scrollYRef est mis à jour
    Et processScrollUpdate est appelé
    Et le progress est calculé et dispatché
    Et le SVG se déplace correctement
    Et il n'y a pas de blocage

  Scenario: Pas de conflit entre initialisation et scroll rapide
    Étant donné que la page vient de se charger
    Quand l'utilisateur scroll très rapidement avant la fin de l'initialisation
    Alors le système détecte que scrollYRef n'est pas à jour
    Et scrollYRef est mis à jour avec window.scrollY
    Et processScrollUpdate fonctionne correctement
    Et il n'y a pas de conflit
```

### Use Case 6: Boucle Infinie

```gherkin
Feature: Boucle Infinie
  En tant qu'utilisateur
  Je veux pouvoir scroller de manière continue sans fin
  Afin de naviguer sans limites

  Background:
    Étant donné que le progress est circulaire (0-1)

  Scenario: Scroll vers l'avant au point 0.99
    Étant donné que le progress est à 0.99
    Quand l'utilisateur scroll vers l'avant
    Alors le progress wraparound vers 0.01
    Et le scroll continue de manière fluide
    Et il n'y a pas de saut visible

  Scenario: Scroll vers l'arrière au point 0.01
    Étant donné que le progress est à 0.01
    Quand l'utilisateur scroll vers l'arrière
    Alors le progress wraparound vers 0.99
    Et le scroll continue de manière fluide
    Et il n'y a pas de saut visible

  Scenario: Inertie fonctionne au point 0
    Étant donné que le progress est à 0.005
    Et que l'utilisateur scroll vers l'arrière avec force
    Quand l'utilisateur arrête de scroller
    Alors l'inertie continue
    Et le progress wraparound vers 0.99
    Et l'inertie continue de fonctionner
    Et il n'y a pas d'arrêt brutal
```

### Use Case 7: Direction et Synchronisation

```gherkin
Feature: Direction et Synchronisation
  En tant qu'utilisateur
  Je veux que la direction du scroll soit cohérente
  Afin de comprendre où je vais

  Background:
    Étant donné que le système est initialisé

  Scenario: Direction forward lors du scroll manuel
    Étant donné que le progress est à 0.3
    Quand l'utilisateur scroll vers l'avant
    Alors lastScrollDirection est mis à "forward"
    Et autoScrollDirection est synchronisé à 1
    Et le PointTrail pointe vers la droite

  Scenario: Direction backward lors du scroll manuel
    Étant donné que le progress est à 0.5
    Quand l'utilisateur scroll vers l'arrière
    Alors lastScrollDirection est mis à "backward"
    Et autoScrollDirection est synchronisé à -1
    Et le PointTrail pointe vers la gauche

  Scenario: Synchronisation bidirectionnelle autoplay ↔ scroll manuel
    Étant donné que l'utilisateur scroll manuellement vers l'avant
    Et que lastScrollDirection est "forward"
    Quand l'utilisateur démarre l'autoplay
    Alors autoScrollDirection est à 1
    Et l'autoplay va vers l'avant
    Et le PointTrail pointe vers la droite

  Scenario: Changement de direction pendant l'autoplay
    Étant donné que l'autoplay est actif et va vers l'avant
    Quand l'utilisateur clique sur le bouton "Direction"
    Alors autoScrollDirection est inversé à -1
    Et lastScrollDirection est mis à "backward"
    Et l'autoplay continue dans la nouvelle direction
    Et le PointTrail pointe vers la gauche
    Et l'autoplay n'est pas mis en pause
```

### Use Case 8: Gestion des Modals

```gherkin
Feature: Gestion des Modals
  En tant qu'utilisateur
  Je veux que le scroll s'arrête quand une modal est ouverte
  Afin de me concentrer sur la modal

  Background:
    Étant donné qu'une modal peut s'ouvrir

  Scenario: Scroll manuel bloqué pendant modal
    Étant donné qu'une modal est ouverte (isModalOpen = true)
    Quand l'utilisateur essaie de scroller
    Alors handleUserInteraction retourne immédiatement
    Et processScrollUpdate retourne immédiatement
    Et le progress ne change pas
    Et le SVG ne bouge pas

  Scenario: Autoplay bloqué pendant modal
    Étant donné que l'autoplay est actif
    Et qu'une modal s'ouvre
    Quand l'animation de l'autoplay s'exécute
    Alors animate retourne immédiatement
    Et le progress ne change pas
    Et l'autoplay reste actif (isAutoPlaying = true)
```

### Use Case 9: Performance et Optimisations

```gherkin
Feature: Performance et Optimisations
  En tant qu'utilisateur
  Je veux que le scroll soit fluide et performant
  Afin d'avoir une expérience agréable

  Background:
    Étant donné que le système est optimisé

  Scenario: Pas de calculs inutiles
    Étant donné que le scroll est en cours
    Quand processScrollUpdate est appelé
    Alors pendingUpdateRef empêche les appels multiples
    Et un seul RAF est programmé à la fois
    Et les calculs sont optimisés

  Scenario: Easing loop s'arrête quand nécessaire
    Étant donné que l'easing est actif
    Quand le delta devient inférieur à SCROLL_EASING_MIN_DELTA
    Alors la boucle d'easing s'arrête
    Et easingRafIdRef est nettoyé
    Et isEasingActiveRef est mis à false

  Scenario: Nettoyage des event listeners
    Étant donné que le composant est monté
    Quand le composant est démonté
    Alors tous les event listeners sont retirés
    Et tous les RAF sont annulés
    Et il n'y a pas de fuites mémoire
```
