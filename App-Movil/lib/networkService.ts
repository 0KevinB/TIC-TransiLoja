import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Importación condicional para evitar errores en web
let NetInfo: any = null;
let NetInfoState: any = null;

try {
  if (Platform.OS !== 'web') {
    const netInfoModule = require('@react-native-community/netinfo');
    NetInfo = netInfoModule.default;
    NetInfoState = netInfoModule.NetInfoState;
  }
} catch (error) {
  console.warn('NetInfo no disponible, usando fallback');
}

export interface NetworkStatus {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean | null;
}

class NetworkService {
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private currentStatus: NetworkStatus = {
    isConnected: false,
    type: 'unknown',
    isInternetReachable: null
  };

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (NetInfo) {
      NetInfo.addEventListener((state: any) => {
        const status: NetworkStatus = {
          isConnected: state.isConnected ?? true,
          type: state.type || 'wifi',
          isInternetReachable: state.isInternetReachable ?? true
        };

        this.currentStatus = status;
        this.notifyListeners(status);
      });
    } else {
      // Fallback para web/unsupported platforms
      this.currentStatus = {
        isConnected: true,
        type: 'wifi',
        isInternetReachable: true
      };
    }
  }

  public async getCurrentStatus(): Promise<NetworkStatus> {
    if (NetInfo) {
      try {
        const state = await NetInfo.fetch();
        const status: NetworkStatus = {
          isConnected: state.isConnected ?? true,
          type: state.type || 'wifi',
          isInternetReachable: state.isInternetReachable ?? true
        };

        this.currentStatus = status;
        return status;
      } catch (error) {
        console.warn('Error fetching network status:', error);
      }
    }

    // Fallback
    return this.currentStatus;
  }

  public addListener(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.push(callback);

    // Enviar estado actual inmediatamente
    callback(this.currentStatus);

    // Retornar función para remover el listener
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(status: NetworkStatus) {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error notifying network listener:', error);
      }
    });
  }

  public isOnline(): boolean {
    return this.currentStatus.isConnected &&
           (this.currentStatus.isInternetReachable === true ||
            this.currentStatus.isInternetReachable === null);
  }

  public isOffline(): boolean {
    return !this.isOnline();
  }
}

export const networkService = new NetworkService();

// React Hook para usar el estado de la red
export function useNetworkStatus(): NetworkStatus & { isOnline: boolean; isOffline: boolean } {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: false,
    type: 'unknown',
    isInternetReachable: null
  });

  useEffect(() => {
    const unsubscribe = networkService.addListener(setNetworkStatus);

    // Obtener estado inicial
    networkService.getCurrentStatus().then(setNetworkStatus);

    return unsubscribe;
  }, []);

  return {
    ...networkStatus,
    isOnline: networkStatus.isConnected &&
              (networkStatus.isInternetReachable === true ||
               networkStatus.isInternetReachable === null),
    isOffline: !(networkStatus.isConnected &&
                (networkStatus.isInternetReachable === true ||
                 networkStatus.isInternetReachable === null))
  };
}

export default networkService;