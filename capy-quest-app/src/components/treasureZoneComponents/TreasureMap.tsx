import React, { useCallback, useEffect } from 'react'
import Map from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapMarkers } from './MapMarkers'
import { MapLayers } from './MapLayers'
import type { Coordinates, PolygonData, ViewState } from '@/types/treasure-zone'

interface TreasureMapProps {
  mapboxToken: string
  userLocation: Coordinates | null
  currentPolygon: Coordinates[]
  savedPolygons: PolygonData[]
  isDrawing: boolean
  viewState: ViewState
  onViewStateChange: (viewState: ViewState) => void
  onMapClick: (coordinates: Coordinates) => void
}

export const TreasureMap: React.FC<TreasureMapProps> = ({
  mapboxToken,
  userLocation,
  currentPolygon,
  savedPolygons,
  isDrawing,
  viewState,
  onViewStateChange,
  onMapClick
}) => {
  // Update view state when user location changes
  useEffect(() => {
    if (userLocation) {
      onViewStateChange({
        longitude: userLocation.lng,
        latitude: userLocation.lat,
        zoom: 16
      })
    }
  }, [userLocation, onViewStateChange])

  const handleMapClick = useCallback((event: any) => {
    if (!isDrawing) return
    const { lng, lat } = event.lngLat
    onMapClick({ lng, lat })
  }, [isDrawing, onMapClick])

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-200" 
         style={{ height: 'calc(100vh - 480px)', minHeight: '300px' }}>
      <Map
        mapboxAccessToken={mapboxToken}
        {...viewState}
        onMove={evt => onViewStateChange(evt.viewState)}
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        attributionControl={true}
        cursor={isDrawing ? 'crosshair' : 'default'}
      >
        <MapMarkers 
          userLocation={userLocation}
          currentPolygon={currentPolygon}
        />
        <MapLayers 
          currentPolygon={currentPolygon}
          savedPolygons={savedPolygons}
        />
      </Map>
    </div>
  )
}