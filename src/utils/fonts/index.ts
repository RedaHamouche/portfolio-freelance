/**
 * Configuration optimisée des fonts avec next/font/local
 * Améliore les performances en préchargeant et optimisant les fonts
 * 
 * Note: Les chemins doivent être relatifs au fichier source (pas de chemins absolus)
 * Depuis src/utils/fonts/index.ts vers public/fonts/ = ../../../public/fonts/
 */

import localFont from 'next/font/local';

/**
 * Font Montreal - Regular
 * Font critique (utilisée dans le header et composants principaux)
 * Supporte font-weight: normal et bold (via font-weight CSS)
 * 
 * Note: Next.js exige des chemins littéraux (pas de variables ou template strings)
 * Chemin depuis src/utils/fonts/index.ts vers public/fonts/ = ../../../public/fonts/
 */
export const montrealRegular = localFont({
  src: [
    {
      // public/fonts/Montreal/Montreal-Regular.woff2
      path: '../../../public/fonts/Montreal/Montreal-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      // public/fonts/Montreal/Montreal-Bold.woff2
      path: '../../../public/fonts/Montreal/Montreal-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-montreal',
  display: 'swap', // Affiche immédiatement avec fallback, puis remplace
  preload: true, // Précharge la font (critique pour above-the-fold)
  fallback: ['system-ui', 'arial'], // Fallback en cas d'échec
});

/**
 * Font Playfair - Regular
 * Font non critique (utilisée dans les composants secondaires)
 * Supporte font-style: normal et italic (via font-style CSS)
 * 
 * Note: Next.js exige des chemins littéraux (pas de variables ou template strings)
 * Chemin depuis src/utils/fonts/index.ts vers public/fonts/ = ../../../public/fonts/
 */
export const playfairRegular = localFont({
  src: [
    {
      // public/fonts/Playfair/Playfair.woff2
      path: '../../../public/fonts/Playfair/Playfair.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      // public/fonts/Playfair/Playfair-Italic.woff2
      path: '../../../public/fonts/Playfair/Playfair-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
  ],
  variable: '--font-playfair',
  display: 'optional', // N'affiche pas si pas chargée (non critique)
  preload: false, // Ne précharge pas (non critique, très lourd ~615KB)
  fallback: ['serif'],
});


