import React from 'react'
import { Navigation, Loader } from 'lucide-react'
import type { Coordinates } from '@/types/treasure-zone'

interface LocationPanelProps {
  userLocation: Coordinates | null
  locationError: string | null
  isGettingLocation: boolean
  onRetryLocation: () => void
}

export const LocationPanel: React.FC<LocationPanelProps> = ({
  userLocation,
  locationError,
  isGettingLocation,
  onRetryLocation
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-2 border-amber-200 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Navigation className={`w-5 h-5 ${userLocation ? 'text-green-500' : 'text-gray-400'}`} />
          <span className="font-semibold text-amber-800">Ubicación</span>
        </div>
        {isGettingLocation && <Loader className="w-5 h-5 animate-spin text-yellow-500" />}
      </div>
      
      {locationError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{locationError}</p>
          <button 
            onClick={onRetryLocation}
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : userLocation ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-green-600 text-sm font-mono">
            {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
          </p>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">Obteniendo ubicación...</p>
      )}
    </div>
  )
}