import { headers } from 'next/headers';
import MapScrollerWrapper from '@/components/app/MapScroller/MapScrollerWrapper';
import { loadServerConfigs } from '@/utils/ssr/loadServerConfigs';
import { calculateInitialProgress } from '@/utils/ssr/calculateInitialProgress';
import { detectDeviceFromUserAgent } from '@/utils/ssr/detectDevice';
import { generateAllImagePlaceholders } from '@/utils/ssr/generateAllImagePlaceholders';

/**
 * Page principale - Server Component
 * Charge les configurations et pré-calcule le progress initial côté serveur
 * pour améliorer les performances (FCP, TTI)
 */
export default async function Home() {
  // Charger les configurations côté serveur (avec index pré-construits)
  const serverConfigs = await loadServerConfigs();

  // Générer les placeholders blur pour les images locales
  // Cela améliore le LCP (Largest Contentful Paint)
  const imagePlaceholders = await generateAllImagePlaceholders(serverConfigs);

  // Détecter le device côté serveur pour éviter le FOUC
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');
  const isDesktop = detectDeviceFromUserAgent(userAgent);

  // Récupérer l'URL pour extraire le hash
  // Note: Dans App Router, on ne peut pas accéder directement au hash côté serveur
  // Le hash est uniquement disponible côté client
  // On va donc pré-calculer avec hash = null, et le client vérifiera le hash si présent
  const referer = headersList.get('referer') || '';
  const hash = referer.includes('#') ? referer.split('#')[1] : null;

  // Pré-calculer le progress initial côté serveur
  const initialProgress = calculateInitialProgress(hash ? `#${hash}` : null, serverConfigs);

  return (
    <MapScrollerWrapper
      serverConfigs={serverConfigs}
      initialProgress={initialProgress}
      isDesktop={isDesktop}
      imagePlaceholders={imagePlaceholders}
    />
  );
}
