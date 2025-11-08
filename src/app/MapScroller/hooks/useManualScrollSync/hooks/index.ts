/**
 * Sous-hooks pour useManualScrollSync
 * Chaque hook gère une responsabilité spécifique
 */

export { useEasingLoop } from './useEasingLoop';
export type { UseEasingLoopRefs } from './useEasingLoop';

export { useScrollEventListeners } from './useScrollEventListeners';

export { useScrollInitialization } from './useScrollInitialization';
export type { UseScrollInitializationRefs } from './useScrollInitialization';

export { useScrollHandlers } from './useScrollHandlers';
export type { ScrollHandlersRefs } from './useScrollHandlers';

export { scheduleScrollEndCheck } from './useScrollEndCheck';

