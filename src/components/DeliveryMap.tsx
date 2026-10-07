"use client";

import { useEffect } from 'react';
import { Map, MapMarker, MarkerContent, useMap } from '@/components/ui/mapcn-marker-tooltip';
import * as maplibregl from 'maplibre-gl';

interface MarkerData {
  id: string;
  type: 'store' | 'customer' | 'driver';
  lng: number;
  lat: number;
  label?: string;
}

interface DeliveryMapProps {
  markers: MarkerData[];
  routeGeoJSON?: any;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

function RouteLayer({ geojson }: { geojson: any }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || !geojson) return;

    if (map.getSource('route')) {
      (map.getSource('route') as maplibregl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource('route', {
        type: 'geojson',
        data: geojson
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ff007a',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    }

    return () => {
      // Opcional: limpieza de ruta al desmontar si es necesario
    };
  }, [map, isLoaded, geojson]);

  return null;
}

function BoundsFitter({ markers }: { markers: MarkerData[] }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || markers.length <= 1) return;
    const bounds = new maplibregl.LngLatBounds();
    markers.forEach(m => bounds.extend([m.lng, m.lat]));
    map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
  }, [map, isLoaded, markers]);

  return null;
}

const osmRasterStyle = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap Contributors",
      maxzoom: 19
    }
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm"
    }
  ]
};

export function DeliveryMap({ markers, routeGeoJSON, center = [-74.006, 40.7128], zoom = 13, className = "" }: DeliveryMapProps) {
  if (!center || isNaN(center[0]) || isNaN(center[1])) {
    return null;
  }

  return (
    <div className={`relative w-full h-full rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      <Map 
        center={center} 
        zoom={zoom} 
        styles={{ dark: osmRasterStyle as any, light: osmRasterStyle as any }}
        theme="dark" 
      >
        <RouteLayer geojson={routeGeoJSON} />
        <BoundsFitter markers={markers} />
        
        {markers.map(marker => {
          let markerElement;
          if (marker.type === 'store') {
            markerElement = <div className="h-6 w-6 bg-secondary text-black rounded-lg flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,215,0,0.5)] border-2 border-black">🏪</div>;
          } else if (marker.type === 'customer') {
            markerElement = <div className="h-6 w-6 bg-white text-black rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-black">📍</div>;
          } else if (marker.type === 'driver') {
            markerElement = <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center font-bold shadow-[0_0_20px_rgba(255,0,122,0.8)] border-2 border-black animate-pulse">🛵</div>;
          }

          return (
            <MapMarker key={marker.id} longitude={marker.lng} latitude={marker.lat}>
              <MarkerContent>
                {markerElement}
              </MarkerContent>
            </MapMarker>
          );
        })}
      </Map>
      {/* Overlay opcional para diseño */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]" />
    </div>
  );
}
