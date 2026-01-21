import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: 'low' | 'medium' | 'high';
  onLoad?: () => void;
  onError?: () => void;
}

export const ImageOptimizer = ({
  src,
  alt,
  className = '',
  width,
  height,
  quality = 'medium',
  onLoad,
  onError,
}: ImageOptimizerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    // Create an Image object to preload
    const img = new Image();

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      onLoad?.();
    };

    img.onerror = () => {
      setError(true);
      setIsLoading(false);
      onError?.();
    };

    // Apply quality optimization
    let optimizedSrc = src;
    if (src.includes('supabase') && quality === 'low') {
      optimizedSrc = `${src}?quality=50`;
    } else if (src.includes('supabase') && quality === 'medium') {
      optimizedSrc = `${src}?quality=75`;
    }

    img.src = optimizedSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, quality, onLoad, onError]);

  if (error) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">Image non disponible</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          loading="lazy"
        />
      )}
    </div>
  );
};
