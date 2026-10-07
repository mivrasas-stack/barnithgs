import { Router, RouteResult } from './types';

export class OsrmRouter implements Router {
  // Endpoint de demostración de OSRM (uso público, sujeto a disponibilidad)
  private readonly baseUrl = 'https://router.project-osrm.org/route/v1/driving';

  async getRoute(origin: [number, number], destination: [number, number]): Promise<RouteResult> {
    // REGLA FUNDAMENTAL DE OSRM: longitude,latitude
    const originStr = `${origin[0]},${origin[1]}`;
    const destStr = `${destination[0]},${destination[1]}`;

    // Parámetros: 
    // overview=full (para tener toda la geometría de la línea)
    // geometries=geojson (para pintar directo en maplibre)
    const url = `${this.baseUrl}/${originStr};${destStr}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al conectar con OSRM');
      }

      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No se pudo calcular una ruta.');
      }

      const route = data.routes[0];

      return {
        distance: route.distance, // metros
        eta: route.duration, // segundos
        geometry: route.geometry // GeoJSON format compatible con MapLibre
      };

    } catch (error) {
      console.error('Error en enrutamiento:', error);
      throw error;
    }
  }
}

export const router = new OsrmRouter();
