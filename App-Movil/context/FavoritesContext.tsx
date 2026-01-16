import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';

export interface FavoriteItem {
  id: string;
  type: 'parada' | 'ruta';
  itemId: string;
  name: string;
  subtitle?: string;
  color?: string;
  userId: string;
  added_at: Date;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  loading: boolean;
  addToFavorites: (item: any, type: 'parada' | 'ruta') => Promise<boolean>;
  removeFromFavorites: (itemId: string, type: 'parada' | 'ruta') => Promise<boolean>;
  isFavorite: (itemId: string, type: 'parada' | 'ruta') => boolean;
  getFavoritesByType: (type: 'parada' | 'ruta') => FavoriteItem[];
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar favoritos del usuario cuando cambie la autenticación
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserFavorites(user.uid);
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated, user]);

  const loadUserFavorites = async (userId: string) => {
    setLoading(true);
    try {
      const database = db();
      if (!database) {
        console.warn('Firestore no disponible');
        setFavorites([]);
        return;
      }

      const userDoc = await getDoc(doc(database, 'users', userId));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const savedFavorites = data.favoritesDetails || [];
        
        // Convertir fechas de Firestore
        const processedFavorites = savedFavorites.map((fav: any) => ({
          ...fav,
          added_at: fav.added_at?.toDate() || new Date()
        }));
        
        setFavorites(processedFavorites);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites from Firebase:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const saveFavoritesToFirebase = async (userId: string, favorites: FavoriteItem[]) => {
    try {
      const database = db();
      if (!database) {
        console.warn('Firestore no disponible para guardar favoritos');
        return;
      }

      // Extraer solo los IDs para los arrays legacy
      const favoriteStops = favorites.filter(f => f.type === 'parada').map(f => f.itemId);
      const favoriteRoutes = favorites.filter(f => f.type === 'ruta').map(f => f.itemId);

      // Limpiar campos undefined de los favoritos antes de guardar
      const cleanedFavorites = favorites.map(fav => {
        const cleaned: any = {
          id: fav.id,
          type: fav.type,
          itemId: fav.itemId,
          name: fav.name,
          userId: fav.userId,
          added_at: fav.added_at
        };

        // Solo agregar campos opcionales si tienen valor
        if (fav.subtitle) cleaned.subtitle = fav.subtitle;
        if (fav.color) cleaned.color = fav.color;

        return cleaned;
      });

      // Actualizar el documento del usuario con ambos formatos
      await updateDoc(doc(database, 'users', userId), {
        favoriteStops,
        favoriteRoutes,
        favoritesDetails: cleanedFavorites,
        updatedAt: new Date()
      });

      console.log('Favoritos guardados en Firebase:', {
        stops: favoriteStops.length,
        routes: favoriteRoutes.length
      });
    } catch (error) {
      console.error('Error guardando favoritos en Firebase:', error);
      throw error;
    }
  };

  const addToFavorites = async (item: any, type: 'parada' | 'ruta'): Promise<boolean> => {
    if (!user) return false;

    try {
      const itemId = item.id;
      const name = item.nombre || item.name;
      
      // Verificar si ya está en favoritos
      if (isFavorite(itemId, type)) {
        return true; // Ya está agregado
      }

      const newFavorite: FavoriteItem = {
        id: `${type}_${itemId}_${Date.now()}`,
        type,
        itemId,
        name,
        subtitle: type === 'parada' 
          ? 'Parada de transporte' 
          : `${(item.stopIds || item.paradas || []).length} paradas`,
        color: type === 'ruta' ? item.color : undefined,
        userId: user.uid,
        added_at: new Date()
      };

      const updatedFavorites = [...favorites, newFavorite];
      setFavorites(updatedFavorites);
      await saveFavoritesToFirebase(user.uid, updatedFavorites);
      
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  };

  const removeFromFavorites = async (itemId: string, type: 'parada' | 'ruta'): Promise<boolean> => {
    if (!user) return false;

    try {
      const updatedFavorites = favorites.filter(
        fav => !(fav.itemId === itemId && fav.type === type && fav.userId === user.uid)
      );
      
      setFavorites(updatedFavorites);
      await saveFavoritesToFirebase(user.uid, updatedFavorites);
      
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  };

  const isFavorite = (itemId: string, type: 'parada' | 'ruta'): boolean => {
    if (!user) return false;
    return favorites.some(
      fav => fav.itemId === itemId && fav.type === type && fav.userId === user.uid
    );
  };

  const getFavoritesByType = (type: 'parada' | 'ruta'): FavoriteItem[] => {
    if (!user) return [];
    return favorites.filter(fav => fav.type === type && fav.userId === user.uid);
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      loading,
      addToFavorites,
      removeFromFavorites,
      isFavorite,
      getFavoritesByType,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};