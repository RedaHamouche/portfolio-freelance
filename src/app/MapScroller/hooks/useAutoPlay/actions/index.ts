/**
 * Actions pour useAutoPlay
 * Fonctions avec effets de bord (dispatch Redux, setTimeout, window.scrollTo, etc.)
 */

export { handlePauseOnAnchor } from './handlePauseOnAnchor';
export { createResumeAfterPauseCallback } from './createResumeAfterPauseCallback';
export { clearPauseTimeout } from './clearPauseTimeout';
export { resetPauseState } from './resetPauseState';
export { syncScrollPosition } from './syncScrollPosition';
