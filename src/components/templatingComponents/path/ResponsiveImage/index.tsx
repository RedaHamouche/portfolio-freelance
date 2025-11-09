import Image from '@/components/commons/Image';
import { ResponsiveImage as ResponsiveImageType } from '../types';
import { useImagePlaceholdersSafe } from '@/contexts/ImagePlaceholdersContext';
import { useDeviceSafe } from '@/contexts/DeviceContext';

interface ResponsiveImageProps extends ResponsiveImageType, Record<string, unknown> {
  className?: string;
  onClick?: () => void;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  componentId?: string; // ID du composant pour récupérer le placeholder
}

export default function ResponsiveImage({
  src,
  alt,
  width,
  height,
  quality = 85,
  priority = false,
  className,
  onClick,
  sizes = '(max-width: 768px) 100vw, 50vw',
  fill = false,
  style,
  componentId,
}: ResponsiveImageProps) {
  // Récupérer les placeholders blur pré-générés côté serveur
  const { getPlaceholder } = useImagePlaceholdersSafe();
  const { isDesktop } = useDeviceSafe();
  
  // Récupérer le placeholder si disponible
  let blurDataURL: string | undefined;
  if (componentId) {
    const placeholder = getPlaceholder(componentId);
    
    if (placeholder) {
      // Utiliser le placeholder approprié selon le device
      blurDataURL = isDesktop
        ? placeholder.desktopBlurDataURL || placeholder.blurDataURL
        : placeholder.mobileBlurDataURL || placeholder.blurDataURL;
    }
  }

  return (
    <Image
      src={src.desktop}
      mobileSrc={src.mobile}
      desktopSrc={src.desktop}
      alt={alt}
      width={width}
      height={height}
      quality={quality}
      priority={priority}
      className={className}
      onClick={onClick}
      sizes={sizes}
      fill={fill}
      style={style}
      placeholder={blurDataURL ? 'blur' : 'empty'}
      blurDataURL={blurDataURL}
    />
  );
} 