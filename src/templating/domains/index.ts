/**
 * Point d'entrée central pour tous les domaines
 * Exporte les factories et les types de tous les domaines
 */

// Page Domain
export { createPageDomain } from './page';
export type { PageComponent, PageConfig, ComponentPosition } from './page';

// Path Domain
export { createPathDomain } from './path';
export type { PathComponent, PathComponentsConfig, PathComponentPosition } from './path';

// Tangente Domain
export { createTangenteDomain } from './tangente';
export type { PathTangenteComponent, PathTangenteComponentsConfig, PathTangenteComponentPosition } from './tangente';

