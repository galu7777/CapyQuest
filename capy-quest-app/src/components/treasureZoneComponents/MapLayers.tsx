import React from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { Coordinates, PolygonData } from '@/types/treasure-zone'

interface MapLayersProps {
  currentPolygon: Coordinates[]
  savedPolygons: PolygonData[]
}

export const MapLayers: React.FC<MapLayersProps> = ({
  currentPolygon,
  savedPolygons
}) => {
  // Create polygon GeoJSON for current drawing
  const currentPolygonGeoJSON = currentPolygon.length > 2 ? {
    type: 'Feature' as const,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [[...currentPolygon.map(c => [c.lng, c.lat]), [currentPolygon[0].lng, currentPolygon[0].lat]]]
    }
  } : null

  // Create polygon GeoJSON for saved polygons
  const savedPolygonsGeoJSON = {
    type: 'FeatureCollection' as const,
    features: savedPolygons.map(polygon => ({
      type: 'Feature' as const,
      properties: { id: polygon.id, name: polygon.name },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[...polygon.coordinates.map(c => [c.lng, c.lat]), [polygon.coordinates[0].lng, polygon.coordinates[0].lat]]]
      }
    }))
  }

  return (
    <>
      {/* Current Polygon */}
      {currentPolygonGeoJSON && (
        <Source id="current-polygon" type="geojson" data={currentPolygonGeoJSON}>
          <Layer
            id="current-polygon-fill"
            type="fill"
            paint={{
              'fill-color': '#fbbf24',
              'fill-opacity': 0.3
            }}
          />
          <Layer
            id="current-polygon-outline"
            type="line"
            paint={{
              'line-color': '#f59e0b',
              'line-width': 3,
              'line-dasharray': [2, 2]
            }}
          />
        </Source>
      )}

      {/* Saved Polygons */}
      {savedPolygonsGeoJSON.features.length > 0 && (
        <Source id="saved-polygons" type="geojson" data={savedPolygonsGeoJSON}>
          <Layer
            id="saved-polygons-fill"
            type="fill"
            paint={{
              'fill-color': '#10b981',
              'fill-opacity': 0.2
            }}
          />
          <Layer
            id="saved-polygons-outline"
            type="line"
            paint={{
              'line-color': '#059669',
              'line-width': 2
            }}
          />
        </Source>
      )}
    </>
  )
}