export const imageConfig = {
  lazyLoading: {
    rootMargin: '50px', // Distance avant le viewport pour déclencher le chargement
    threshold: 0.1, // Pourcentage de visibilité requis
  },
  responsive: {
    mobileBreakpoint: 768, // Largeur en px pour basculer vers mobile
  },
  quality: {
    default: 85, // Qualité par défaut des images
  },
} as const; 