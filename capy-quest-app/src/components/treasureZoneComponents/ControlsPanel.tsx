import React from 'react'
import { LocationPanel } from './LocationPanel'
import { DrawingControls } from './DrawingControls'
import { SavedPolygonsList } from './SavedPolygonsList'
import type { Coordinates, PolygonData } from '@/types/treasure-zone'

interface ControlsPanelProps {
  userLocation: Coordinates | null
  locationError: string | null
  isGettingLocation: boolean
  onRetryLocation: () => void
  isDrawing: boolean
  currentPolygon: Coordinates[]
  polygonName: string
  savedPolygons: PolygonData[]
  onPolygonNameChange: (name: string) => void
  onStartDrawing: () => void
  onFinishDrawing: () => void
  onClearPolygon: () => void
  onSavePolygon: () => void
  onDeletePolygon: (id: string) => void
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  userLocation,
  locationError,
  isGettingLocation,
  onRetryLocation,
  isDrawing,
  currentPolygon,
  polygonName,
  savedPolygons,
  onPolygonNameChange,
  onStartDrawing,
  onFinishDrawing,
  onClearPolygon,
  onSavePolygon,
  onDeletePolygon
}) => {
  return (
    <div className="p-4 space-y-4">
      <LocationPanel
        userLocation={userLocation}
        locationError={locationError}
        isGettingLocation={isGettingLocation}
        onRetryLocation={onRetryLocation}
      />

      <DrawingControls
        isDrawing={isDrawing}
        currentPolygon={currentPolygon}
        polygonName={polygonName}
        onPolygonNameChange={onPolygonNameChange}
        onStartDrawing={onStartDrawing}
        onFinishDrawing={onFinishDrawing}
        onClearPolygon={onClearPolygon}
        onSavePolygon={onSavePolygon}
      />

      <SavedPolygonsList
        savedPolygons={savedPolygons}
        onDeletePolygon={onDeletePolygon}
      />
    </div>
  )
}