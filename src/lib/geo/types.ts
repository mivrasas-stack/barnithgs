export interface GeocodingResult {
  id: string;
  address: string;
  city: string;
  department: string;
  country: string;
  lat: number;
  lng: number;
  type: string;
}

export interface Geocoder {
  searchAddress(address: string, city?: string): Promise<GeocodingResult[]>;
  reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null>;
}

export interface RouteResult {
  distance: number; // en metros
  eta: number; // en segundos
  geometry: any; // GeoJSON LineString
}

export interface Router {
  getRoute(origin: [number, number], destination: [number, number]): Promise<RouteResult>;
}
