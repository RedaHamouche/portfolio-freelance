import { createPathDomain } from '@/templating/domains/path';
import { AutoPlayUseCase } from '../../application/AutoPlayUseCase';
import { AutoPlayProgressService } from '../../domain/AutoPlayProgressService';
import { AutoPlayPauseService } from '../../domain/AutoPlayPauseService';
import { AutoPlayAnchorDetector } from '../../domain/AutoPlayAnchorDetector';
import { AutoPlayEasingService } from '../../domain/AutoPlayEasingService';

/**
 * Crée une instance de AutoPlayUseCase avec tous ses services
 */
export function createAutoPlayUseCase(
  pathDomain: ReturnType<typeof createPathDomain>
): AutoPlayUseCase {
  const progressService = new AutoPlayProgressService();
  const pauseService = new AutoPlayPauseService();
  const anchorDetector = new AutoPlayAnchorDetector(pathDomain);
  const easingService = new AutoPlayEasingService(pathDomain);
  return new AutoPlayUseCase(progressService, pauseService, anchorDetector, easingService);
}

