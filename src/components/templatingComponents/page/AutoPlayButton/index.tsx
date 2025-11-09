import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setAutoScrollDirection, setAutoPlaying, setLastScrollDirection } from '@/store/scrollSlice';
import styles from './index.module.scss';

/**
 * Bouton temporaire play/pause pour tester l'autoplay
 * Position fixe en bas à droite
 * Découplé de la fonctionnalité (utilise Redux)
 */
const AutoPlayButton: React.FC = () => {
  const isAutoPlaying = useSelector((state: RootState) => state.scroll.isAutoPlaying);
  const autoScrollDirection = useSelector((state: RootState) => state.scroll.autoScrollDirection);
  const isAutoScrollTemporarilyPaused = useSelector(
    (state: RootState) => state.scroll.isAutoScrollTemporarilyPaused
  );
  const dispatch = useDispatch();

  // Utiliser un état local pour tracker le chargement
  const [isSystemReady, setIsSystemReady] = useState(false);
  
  // Refs pour éviter le double déclenchement (touch + click sur mobile)
  const lastTouchTimeRef = useRef<number>(0);
  const lastDirectionTouchTimeRef = useRef<number>(0);

  // Vérifier si le système est prêt en attendant que le path soit chargé
  useEffect(() => {
    const checkSystemReady = () => {
      // Vérifier si le path SVG est chargé
      const pathElement = document.querySelector('path');
      if (pathElement && pathElement.getAttribute('d')) {
        setIsSystemReady(true);
      } else {
        // Réessayer dans 100ms si pas encore prêt
        setTimeout(checkSystemReady, 100);
      }
    };

    checkSystemReady();
  }, []);

  const handlePlayPause = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault(); // Empêcher le comportement par défaut
      e.stopPropagation(); // Empêcher la propagation
      
      // Sur mobile, éviter le double déclenchement (touch + click)
      // Si c'est un événement touch, on ignore les clicks pendant 300ms
      if (e.type === 'touchstart' || (e as React.TouchEvent).touches) {
        lastTouchTimeRef.current = Date.now();
      } else if (e.type === 'click') {
        // Si un touch a eu lieu récemment (< 300ms), ignorer le click
        const timeSinceTouch = Date.now() - lastTouchTimeRef.current;
        if (timeSinceTouch < 300) {
          return;
        }
      }
    }
    if (!isSystemReady) return; // Empêcher le clic si le système n'est pas prêt
    dispatch(setAutoPlaying(!isAutoPlaying));
  };

  const handleDirectionChange = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault(); // Empêcher le comportement par défaut
      e.stopPropagation(); // Empêcher la propagation
      
      // Sur mobile, éviter le double déclenchement (touch + click)
      // Si c'est un événement touch, on ignore les clicks pendant 300ms
      if (e.type === 'touchend' || (e as React.TouchEvent).touches) {
        lastDirectionTouchTimeRef.current = Date.now();
      } else if (e.type === 'click') {
        // Si un touch a eu lieu récemment (< 300ms), ignorer le click
        const timeSinceTouch = Date.now() - lastDirectionTouchTimeRef.current;
        if (timeSinceTouch < 300) {
          return;
        }
      }
    }
    if (!isSystemReady) return; // Empêcher le clic si le système n'est pas prêt
    const newDirection = autoScrollDirection === 1 ? -1 : 1;
    dispatch(setAutoScrollDirection(newDirection));
    // Mettre à jour lastScrollDirection pour que PointTrail affiche la bonne direction
    // Note: On ne met PAS en pause l'autoplay lors du changement de direction
    // L'autoplay continue dans la nouvelle direction
    dispatch(setLastScrollDirection(newDirection === 1 ? 'forward' : 'backward'));
  };

  let buttonColor = 'red';
  if (!isSystemReady) {
    buttonColor = 'gray'; // Gris quand le système n'est pas prêt
  } else if (isAutoPlaying && isAutoScrollTemporarilyPaused) {
    buttonColor = 'orange';
  } else if (isAutoPlaying) {
    buttonColor = 'green';
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={handlePlayPause}
        onTouchEnd={handlePlayPause}
        disabled={!isSystemReady}
        className={styles.playPauseButton}
        style={{
          background: buttonColor,
          opacity: isSystemReady ? 1 : 0.5,
          cursor: isSystemReady ? 'pointer' : 'not-allowed',
        }}
        title={!isSystemReady ? 'Chargement en cours...' : undefined}
      >
        {!isSystemReady ? 'Chargement...' : isAutoPlaying ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        onClick={handleDirectionChange}
        onTouchEnd={handleDirectionChange}
        disabled={!isSystemReady}
        className={styles.directionButton}
        style={{
          opacity: isSystemReady ? 1 : 0.5,
          cursor: isSystemReady ? 'pointer' : 'not-allowed',
        }}
      >
        Direction: {autoScrollDirection === 1 ? '→' : '←'}
      </button>
    </div>
  );
};

export default AutoPlayButton;

