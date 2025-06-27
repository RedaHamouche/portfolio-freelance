import Image from '@/app/Image';
import { ResponsiveImage as ResponsiveImageType } from '@/types/image';

interface ResponsiveImageProps extends ResponsiveImageType, Record<string, unknown> {
  className?: string;
  onClick?: () => void;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
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
}: ResponsiveImageProps) {
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
    />
  );
} 