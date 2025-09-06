import React from 'react'
import { Marker } from 'react-map-gl/mapbox'
import type { Coordinates } from '@/types/treasure-zone'

interface MapMarkersProps {
  userLocation: Coordinates | null
  currentPolygon: Coordinates[]
}

export const MapMarkers: React.FC<MapMarkersProps> = ({
  userLocation,
  currentPolygon
}) => {
  return (
    <>
      {/* User Location Marker */}
      {userLocation && (
        <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
          <div className="relative">
            <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg animate-pulse"></div>
            <div className="absolute inset-0 w-4 h-4 bg-blue-400 rounded-full opacity-30 animate-ping"></div>
          </div>
        </Marker>
      )}

      {/* Current Polygon Points */}
      {currentPolygon.map((point, index) => (
        <Marker key={index} longitude={point.lng} latitude={point.lat}>
          <div className="w-3 h-3 bg-yellow-500 border-2 border-white rounded-full shadow-md"></div>
        </Marker>
      ))}
    </>
  )
}