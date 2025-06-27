import {useState, useEffect} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { setAutoScrollDirection, setAutoPlaying } from '../../../store/scrollSlice';

const PlayPauseButton: React.FC = () => {
  const isAutoPlaying = useSelector((state: RootState) => state.scroll.isAutoPlaying);
  const autoScrollDirection = useSelector((state: RootState) => state.scroll.autoScrollDirection);
  const isAutoScrollTemporarilyPaused = useSelector((state: RootState) => state.scroll.isAutoScrollTemporarilyPaused);
  const dispatch = useDispatch();

  // Utiliser un état local pour tracker le chargement
  const [isSystemReady, setIsSystemReady] = useState(false);

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

  const handlePlayPause = () => {
    if (!isSystemReady) return; // Empêcher le clic si le système n'est pas prêt
    dispatch(setAutoPlaying(!isAutoPlaying));
  };

  const handleDirectionChange = () => {
    if (!isSystemReady) return; // Empêcher le clic si le système n'est pas prêt
    dispatch(setAutoScrollDirection(autoScrollDirection === 1 ? -1 : 1));
  };

  let buttonColor = 'red';
  if (!isSystemReady) {
    buttonColor = 'gray'; // Gris quand le système n'est pas prêt
  } else if (isAutoPlaying && isAutoScrollTemporarilyPaused) {
    buttonColor = 'orange';
  } else if (isAutoPlaying) {
    buttonColor = 'green';
  }

  console.log('this is isSystemReady::', isSystemReady);

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <button 
        type="button" 
        onClick={handlePlayPause} 
        disabled={!isSystemReady}
        style={{ 
          background: buttonColor, 
          color: 'white', 
          fontWeight: 'bold',
          opacity: isSystemReady ? 1 : 0.5,
          cursor: isSystemReady ? 'pointer' : 'not-allowed'
        }}
        title={!isSystemReady ? 'Chargement en cours...' : undefined}
      >
        {!isSystemReady ? 'Chargement...' : (isAutoPlaying ? 'Pause' : 'Play')}
      </button>
      <button 
        type="button" 
        onClick={handleDirectionChange}
        disabled={!isSystemReady}
        style={{
          opacity: isSystemReady ? 1 : 0.5,
          cursor: isSystemReady ? 'pointer' : 'not-allowed'
        }}
      >
        Direction: {autoScrollDirection === 1 ? '→' : '←'}
      </button>
    </div>
  );
};

export default PlayPauseButton; 