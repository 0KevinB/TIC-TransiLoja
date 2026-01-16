import Constants from 'expo-constants';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface Place {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface GeocodeResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
  types: string[];
}

interface DirectionsResult {
  routes: Array<{
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      start_address: string;
      end_address: string;
      steps: Array<{
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        html_instructions: string;
        polyline: { points: string };
        start_location: { lat: number; lng: number };
        end_location: { lat: number; lng: number };
        travel_mode: string;
      }>;
    }>;
    overview_polyline: { points: string };
    summary: string;
    warnings: string[];
  }>;
  status: string;
}

class GoogleMapsService {
  private apiKey: string;

  constructor() {
    // Obtener la API key desde las variables de entorno
    this.apiKey = Constants.expoConfig?.extra?.googleMapsApiKey || 
                  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 
                  '';

    if (!this.apiKey) {
      console.warn('Google Maps API Key no encontrada. Algunas funcionalidades pueden no funcionar.');
    }
  }

  /**
   * Autocomplete de lugares usando Google Places API
   */
  async searchPlaces(input: string, location?: LatLng, radius = 50000): Promise<Place[]> {
    if (!this.apiKey || !input.trim()) {
      return [];
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${this.apiKey}&language=es&components=country:ec`;

      // Si tenemos ubicación, priorizar resultados cercanos
      if (location) {
        url += `&location=${location.latitude},${location.longitude}&radius=${radius}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.predictions || [];
      } else {
        console.warn('Places API error:', data.status, data.error_message);
        return [];
      }
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  /**
   * Geocoding: convertir dirección a coordenadas
   */
  async geocodeAddress(address: string): Promise<LatLng | null> {
    if (!this.apiKey || !address.trim()) {
      return null;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}&language=es&region=ec`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result: GeocodeResult = data.results[0];
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng
        };
      } else {
        console.warn('Geocoding error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Reverse Geocoding: convertir coordenadas a dirección
   */
  async reverseGeocode(location: LatLng): Promise<string | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${this.apiKey}&language=es`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        console.warn('Reverse geocoding error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Obtener detalles de un lugar por place_id
   */
  async getPlaceDetails(placeId: string): Promise<{ address: string; location: LatLng } | null> {
    if (!this.apiKey || !placeId) {
      return null;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry/location&key=${this.apiKey}&language=es`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return {
          address: data.result.formatted_address,
          location: {
            latitude: data.result.geometry.location.lat,
            longitude: data.result.geometry.location.lng
          }
        };
      } else {
        console.warn('Place details error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }

  /**
   * Obtener direcciones entre dos puntos
   */
  async getDirections(
    origin: LatLng | string,
    destination: LatLng | string,
    mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'transit'
  ): Promise<DirectionsResult | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const originStr = typeof origin === 'string' 
        ? encodeURIComponent(origin)
        : `${origin.latitude},${origin.longitude}`;
      
      const destinationStr = typeof destination === 'string'
        ? encodeURIComponent(destination)
        : `${destination.latitude},${destination.longitude}`;

      let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=${mode}&key=${this.apiKey}&language=es&region=ec`;
      
      // Configuraciones específicas para transporte público
      if (mode === 'transit') {
        const now = Math.floor(Date.now() / 1000);
        url += `&departure_time=${now}&transit_mode=bus`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data;
      } else {
        console.warn('Directions error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  }

  /**
   * Calcular distancia entre dos puntos
   */
  async getDistanceMatrix(
    origins: LatLng[],
    destinations: LatLng[],
    mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'walking'
  ): Promise<any> {
    if (!this.apiKey || !origins.length || !destinations.length) {
      return null;
    }

    try {
      const originsStr = origins.map(o => `${o.latitude},${o.longitude}`).join('|');
      const destinationsStr = destinations.map(d => `${d.latitude},${d.longitude}`).join('|');

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&mode=${mode}&key=${this.apiKey}&language=es&units=metric`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data;
      } else {
        console.warn('Distance Matrix error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Error getting distance matrix:', error);
      return null;
    }
  }

  /**
   * Buscar paradas de transporte público cercanas
   */
  async findNearbyTransitStops(location: LatLng, radius = 1000): Promise<any[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=${radius}&type=bus_station|subway_station|transit_station&key=${this.apiKey}&language=es`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.results || [];
      } else {
        console.warn('Nearby search error:', data.status, data.error_message);
        return [];
      }
    } catch (error) {
      console.error('Error finding nearby transit stops:', error);
      return [];
    }
  }

  /**
   * Decodificar polyline (para rutas)
   */
  decodePolyline(encoded: string): LatLng[] {
    const poly: LatLng[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b: number;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }

    return poly;
  }
}

// Exportar instancia singleton
export const googleMapsService = new GoogleMapsService();

// Exportar tipos para uso en otros archivos
export type { LatLng, Place, GeocodeResult, DirectionsResult };