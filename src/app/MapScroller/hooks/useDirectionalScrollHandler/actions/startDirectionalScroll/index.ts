import { useDispatch } from 'react-redux';
import { setIsScrolling } from '@/store/scrollSlice';

/**
 * Démarre le scroll directionnel
 */
export function startDirectionalScroll(
  dispatch: ReturnType<typeof useDispatch>,
  start: (callback: FrameRequestCallback) => void,
  animate: FrameRequestCallback
): void {
  dispatch(setIsScrolling(true));
  start(animate);
}

