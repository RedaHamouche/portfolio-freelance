import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setProgress } from '@/store/scrollSlice';
import pathComponents from '@/templating/pathComponents.json';
import {
  calculateFakeScrollHeight,
  calculateMaxScroll,
  calculateScrollYFromProgress,
} from '@/utils/scrollCalculations';

/**
 * Hook pour gérer l'initialisation du scroll et la synchronisation avec les hash/anchors
 */
export const useScrollInitialization = (globalPathLength: number) => {
  const [isScrollSynced, setIsScrollSynced] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    // On attend que la longueur du path soit connue
    if (!globalPathLength) return;

    const hash = window.location.hash.replace('#', '');
    
    // Pas de hash, on initialise à 0.5% (point de départ)
    if (!hash) {
      const initialProgress = 0.005; // 0.5%
      dispatch(setProgress(initialProgress));
      
      // Synchroniser la position de scroll avec le progress initial
      const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
      const maxScroll = calculateMaxScroll(fakeScrollHeight, window.innerHeight);
      const targetScrollY = calculateScrollYFromProgress(initialProgress, maxScroll);
      
      window.scrollTo(0, targetScrollY);
      setIsScrollSynced(true);
      return;
    }

    // Trouver le composant correspondant au hash
    const anchorComponent = pathComponents.find(c => c.anchorId === hash);
    
    if (anchorComponent?.position?.progress !== undefined) {
      const progress = anchorComponent.position.progress;
      dispatch(setProgress(progress));
      
      const fakeScrollHeight = calculateFakeScrollHeight(globalPathLength);
      const maxScroll = calculateMaxScroll(fakeScrollHeight, window.innerHeight);
      const targetScrollY = calculateScrollYFromProgress(progress, maxScroll);
      
      window.scrollTo(0, targetScrollY);
    }
    
    setIsScrollSynced(true);
  }, [globalPathLength, dispatch]);

  return isScrollSynced;
};

