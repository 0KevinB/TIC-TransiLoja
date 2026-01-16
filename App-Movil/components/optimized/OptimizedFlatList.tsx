/**
 * FlatList Optimizada
 * Componente con optimizaciones de rendimiento para listas grandes
 */

import React, { memo, useCallback } from 'react';
import { FlatList, FlatListProps, ViewToken } from 'react-native';

interface OptimizedFlatListProps<T> extends FlatListProps<T> {
  // Props adicionales para optimización
  estimatedItemSize?: number;
}

function OptimizedFlatListComponent<T>(props: OptimizedFlatListProps<T>) {
  const {
    estimatedItemSize = 80,
    onViewableItemsChanged,
    ...restProps
  } = props;

  // Memoizar el handler de items visibles
  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      onViewableItemsChanged?.(info);
    },
    [onViewableItemsChanged]
  );

  return (
    <FlatList
      {...restProps}
      // Optimizaciones de rendimiento
      removeClippedSubviews={true} // Remueve vistas fuera de pantalla
      maxToRenderPerBatch={10} // Renderiza máximo 10 items por batch
      updateCellsBatchingPeriod={50} // Actualiza cada 50ms
      initialNumToRender={10} // Renderiza 10 items inicialmente
      windowSize={5} // Mantiene 5 pantallas de items en memoria
      getItemLayout={
        props.getItemLayout ||
        ((data, index) => ({
          length: estimatedItemSize,
          offset: estimatedItemSize * index,
          index,
        }))
      }
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 500,
      }}
      // Mejorar rendimiento en Android
      disableIntervalMomentum={true}
      // Reducir uso de memoria
      persistentScrollbar={false}
    />
  );
}

export const OptimizedFlatList = memo(
  OptimizedFlatListComponent
) as typeof OptimizedFlatListComponent;
