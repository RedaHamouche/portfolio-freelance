import { useDispatch } from 'react-redux';
import { setIsScrolling } from '@/store/scrollSlice';

/**
 * Arrête le scroll directionnel
 */
export function stopDirectionalScroll(
  dispatch: ReturnType<typeof useDispatch>,
  stop: () => void
): void {
  dispatch(setIsScrolling(false));
  stop();
}

