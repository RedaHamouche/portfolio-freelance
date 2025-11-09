import { useDispatch } from 'react-redux';
import { setProgress, setLastScrollDirection } from '@/store/scrollSlice';

/**
 * Met à jour le progress et la direction du scroll dans Redux
 */
export function updateProgress(
  newProgress: number,
  scrollDirection: 'forward' | 'backward',
  dispatch: ReturnType<typeof useDispatch>
): void {
  dispatch(setLastScrollDirection(scrollDirection));
  dispatch(setProgress(newProgress));
}

