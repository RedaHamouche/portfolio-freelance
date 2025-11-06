import Image from '@/app/Image';
import styles from './index.module.scss';

export type PieceOfArtType = {
  src?: string;
  mobileSrc?: string;
  desktopSrc?: string;
  alt?: string;
  width?: number;
  height?: number;
  displayName?: string;
}

export default function PieceOfArt({
  src,
  mobileSrc,
  desktopSrc,
  alt = 'Piece of Art',
  width = 300,
  height = 300,
  displayName,
}: PieceOfArtType) {
  // Utiliser les sources du JSON, ou fallback vers des images Unsplash par défaut
  const defaultDesktopSrc = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop&q=80';
  const defaultMobileSrc = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop&q=80';
  const defaultSrc = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=450&fit=crop&q=80';

  return (
    <div className={styles.main}>
      {displayName && <h3 className={styles.title}>{displayName}</h3>}
      <Image
        src={src || defaultSrc}
        mobileSrc={mobileSrc || defaultMobileSrc}
        desktopSrc={desktopSrc || defaultDesktopSrc}
        alt={alt}
        width={width}
        height={height}
        className={styles.image}
      />
    </div>
  );
}