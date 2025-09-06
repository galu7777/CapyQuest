'use client'

import React, { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Header } from '@/components/treasureZoneComponents/Header'
import { ControlsPanel } from '@/components/treasureZoneComponents/ControlsPanel'
import { TreasureMap } from '@/components/treasureZoneComponents/TreasureMap'
import { useLocation } from '@/hook/useLocation'
import { usePolygon } from '@/hook/usePolygon'
import type { ViewState } from '@/types/treasure-zone'

export default function TreasureZone() {
  // Environment variable
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  
  // Map view state
  const [viewState, setViewState] = useState<ViewState>({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 14
  })

  // Custom hooks
  const {
    userLocation,
    locationError,
    isGettingLocation,
    startLocationTracking
  } = useLocation()

  const {
    isDrawing,
    currentPolygon,
    savedPolygons,
    polygonName,
    setPolygonName,
    startDrawing,
    finishDrawing,
    addPoint,
    clearCurrentPolygon,
    savePolygon,
    deletePolygon
  } = usePolygon()

  // Handle map click for polygon drawing
  const handleMapClick = (coordinates: { lng: number; lat: number }) => {
    addPoint(coordinates)
  }

  // Error boundary for missing token
  if (!mapboxToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm border-2 border-red-200 shadow-2xl rounded-3xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <p className="text-red-600 font-semibold">
            Mapbox access token is not configured. Please check your environment variables.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <Header />
      
      <ControlsPanel
        userLocation={userLocation}
        locationError={locationError}
        isGettingLocation={isGettingLocation}
        onRetryLocation={startLocationTracking}
        isDrawing={isDrawing}
        currentPolygon={currentPolygon}
        polygonName={polygonName}
        savedPolygons={savedPolygons}
        onPolygonNameChange={setPolygonName}
        onStartDrawing={startDrawing}
        onFinishDrawing={finishDrawing}
        onClearPolygon={clearCurrentPolygon}
        onSavePolygon={savePolygon}
        onDeletePolygon={deletePolygon}
      />

      <TreasureMap
        mapboxToken={mapboxToken}
        userLocation={userLocation}
        currentPolygon={currentPolygon}
        savedPolygons={savedPolygons}
        isDrawing={isDrawing}
        viewState={viewState}
        onViewStateChange={setViewState}
        onMapClick={handleMapClick}
      />
    </div>
  )
}