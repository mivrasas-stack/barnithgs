import { Geocoder, GeocodingResult } from './types';

// Ciudades colombianas principales para validación/priorización
export const COLOMBIAN_CITIES = [
  "Bogotá",
  "Cundinamarca",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Bucaramanga",
  "Pereira",
  "Manizales",
  "Cúcuta",
  "Ibagué",
  "Santa Marta",
  "Villavicencio",
  "Armenia"
];

export const CUNDINAMARCA_MUNICIPALITIES = [
  "Chía",
  "Soacha",
  "Cajicá",
  "Zipaquirá",
  "Mosquera",
  "Funza",
  "Madrid",
  "Facatativá",
  "Tocancipá",
  "Sopó",
  "Cota",
  "La Calera",
  "Tenjo",
  "Tabio",
  "Sibaté",
  "Girardot",
  "Fusagasugá"
];

export class NominatimGeocoder implements Geocoder {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org/search';

  // Normaliza nomenclatura colombiana común
  private normalizeAddress(address: string): string {
    return address
      .replace(/\b(Cl\.?|Cl)\b/gi, 'Calle')
      .replace(/\b(Cra\.?|Cra)\b/gi, 'Carrera')
      .replace(/\b(Av\.?|Av)\b/gi, 'Avenida')
      .replace(/\b(Dg\.?|Dg)\b/gi, 'Diagonal')
      .replace(/\b(Tv\.?|Tv)\b/gi, 'Transversal');
  }

  async searchAddress(address: string, city?: string): Promise<GeocodingResult[]> {
    const normalizedAddress = this.normalizeAddress(address);
    
    // Construir la consulta priorizando Colombia
    let query = normalizedAddress;
    if (city) {
      query = `${query}, ${city}`;
    }

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      countrycodes: 'co', // RESTRICCIÓN ESTRICTA A COLOMBIA
      'accept-language': 'es' // Garantizar respuestas en español
    });

    try {
      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        headers: {
          'User-Agent': 'PartyFlow-DeliveryApp/1.0 (Colombia)' // Identificador responsable
        }
      });

      if (!response.ok) {
        throw new Error('Error al conectar con el servicio de mapas');
      }

      const data = await response.json();

      // Validación estricta post-búsqueda
      return data
        .filter((item: any) => {
          // Si por alguna razón el countrycode falla, validamos la propiedad address
          const isColombia = 
            item.address?.country_code === 'co' || 
            item.address?.country === 'Colombia';
          return isColombia;
        })
        .map((item: any) => ({
          id: item.place_id.toString(),
          address: item.name || item.display_name.split(',')[0], // Intento de nombre corto
          city: item.address.city || item.address.town || item.address.village || city || 'Desconocida',
          department: item.address.state || 'Desconocido',
          country: item.address.country,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon), // Nominatim devuelve 'lon'
          type: item.type
        }));

    } catch (error) {
      console.error('Error en geocodificación:', error);
      return [];
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
      'accept-language': 'es'
    });

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: {
          'User-Agent': 'PartyFlow-DeliveryApp/1.0 (Colombia)'
        }
      });

      if (!response.ok) return null;

      const item = await response.json();
      if (!item || item.error) return null;

      return {
        id: item.place_id?.toString() || `${lat}-${lng}`,
        address: item.name || item.display_name?.split(',')[0] || 'Ubicación GPS',
        city: item.address?.city || item.address?.town || item.address?.village || item.address?.county || 'Desconocida',
        department: item.address?.state || 'Desconocido',
        country: item.address?.country || 'Colombia',
        lat: lat,
        lng: lng,
        type: item.type || 'gps'
      };

    } catch (error) {
      console.error('Error en reverse geocodificación:', error);
      return null;
    }
  }
}

// Instancia singleton para uso general
export const geocoder = new NominatimGeocoder();
