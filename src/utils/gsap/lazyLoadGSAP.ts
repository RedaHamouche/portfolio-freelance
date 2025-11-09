/**
 * Helper pour lazy load GSAP et ses plugins
 * Améliore le bundle initial en chargeant GSAP seulement quand nécessaire
 */

let gsapInstance: typeof import('gsap')['default'] | null = null;
let scrollTriggerInstance: typeof import('gsap/ScrollTrigger')['ScrollTrigger'] | null = null;
let motionPathPluginInstance: typeof import('gsap/MotionPathPlugin')['MotionPathPlugin'] | null = null;
let isRegistered = false;

/**
 * Charge GSAP de manière asynchrone
 * @returns Promise qui résout avec l'instance GSAP
 */
export async function loadGSAP(): Promise<typeof import('gsap')['default']> {
  if (gsapInstance) {
    return gsapInstance;
  }

  // Dynamic import pour code splitting
  const gsapModule = await import('gsap');
  gsapInstance = gsapModule.default;
  return gsapInstance;
}

/**
 * Charge ScrollTrigger de manière asynchrone
 * @returns Promise qui résout avec ScrollTrigger
 */
export async function loadScrollTrigger(): Promise<typeof import('gsap/ScrollTrigger')['ScrollTrigger']> {
  if (scrollTriggerInstance) {
    return scrollTriggerInstance;
  }

  // Dynamic import pour code splitting
  const scrollTriggerModule = await import('gsap/ScrollTrigger');
  scrollTriggerInstance = scrollTriggerModule.ScrollTrigger;
  return scrollTriggerInstance;
}

/**
 * Charge MotionPathPlugin de manière asynchrone
 * @returns Promise qui résout avec MotionPathPlugin
 */
export async function loadMotionPathPlugin(): Promise<typeof import('gsap/MotionPathPlugin')['MotionPathPlugin']> {
  if (motionPathPluginInstance) {
    return motionPathPluginInstance;
  }

  // Dynamic import pour code splitting
  const motionPathModule = await import('gsap/MotionPathPlugin');
  motionPathPluginInstance = motionPathModule.MotionPathPlugin;
  return motionPathPluginInstance;
}

/**
 * Charge GSAP et ses plugins, puis les enregistre
 * @returns Promise qui résout quand tout est chargé et enregistré
 */
export async function loadAndRegisterGSAP(): Promise<{
  gsap: typeof import('gsap')['default'];
  ScrollTrigger: typeof import('gsap/ScrollTrigger')['ScrollTrigger'];
  MotionPathPlugin: typeof import('gsap/MotionPathPlugin')['MotionPathPlugin'];
}> {
  // Charger tout en parallèle
  const [gsap, ScrollTrigger, MotionPathPlugin] = await Promise.all([
    loadGSAP(),
    loadScrollTrigger(),
    loadMotionPathPlugin(),
  ]);

  // Enregistrer les plugins une seule fois
  if (!isRegistered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
    
    // Configurer ScrollTrigger pour ignorer les changements de taille causés par la barre Safari
    ScrollTrigger.config({ ignoreMobileResize: true });
    
    isRegistered = true;
  }

  return { gsap, ScrollTrigger, MotionPathPlugin };
}

// Note: Hook useLazyGSAP retiré car nécessite React
// Utilisez loadGSAP() directement dans vos composants avec useState/useEffect

