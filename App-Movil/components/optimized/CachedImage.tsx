/**
 * Componente de Imagen Optimizada con Caché
 * Carga imágenes de manera eficiente usando el sistema de caché
 */

import React, { useState, useEffect, memo } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import { imageCacheService } from '@/lib/performance/imageCache';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  showLoader?: boolean;
  loaderColor?: string;
}

const CachedImageComponent: React.FC<CachedImageProps> = ({
  uri,
  showLoader = true,
  loaderColor = '#3B82F6',
  style,
  ...props
}) => {
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadImage();
  }, [uri]);

  const loadImage = async () => {
    try {
      setLoading(true);
      setError(false);
      const localUri = await imageCacheService.getCachedImage(uri);
      setCachedUri(localUri);
    } catch (err) {
      console.error('Error cargando imagen:', err);
      setError(true);
      setCachedUri(uri); // Fallback a URI original
    } finally {
      setLoading(false);
    }
  };

  if (loading && showLoader) {
    return (
      <View style={[styles.loaderContainer, style]}>
        <ActivityIndicator size="small" color={loaderColor} />
      </View>
    );
  }

  return (
    <Image
      {...props}
      source={{ uri: cachedUri || uri }}
      style={style}
      onError={() => setError(true)}
    />
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
});

export const CachedImage = memo(CachedImageComponent);
