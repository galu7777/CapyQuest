import React from 'react'
import { Trash2 } from 'lucide-react'
import type { PolygonData } from '@/types/treasure-zone'

interface SavedPolygonsListProps {
  savedPolygons: PolygonData[]
  onDeletePolygon: (id: string) => void
}

export const SavedPolygonsList: React.FC<SavedPolygonsListProps> = ({
  savedPolygons,
  onDeletePolygon
}) => {
  if (savedPolygons.length === 0) return null

  return (
    <div className="bg-white/90 backdrop-blur-sm border-2 border-amber-200 rounded-2xl p-4">
      <h3 className="font-semibold text-amber-800 mb-3">
        Perímetros Guardados ({savedPolygons.length})
      </h3>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {savedPolygons.map(polygon => (
          <div key={polygon.id} className="flex items-center justify-between bg-amber-50 rounded-lg p-2">
            <div>
              <p className="font-medium text-amber-800 text-sm">{polygon.name}</p>
              <p className="text-amber-600 text-xs">{polygon.coordinates.length} puntos</p>
            </div>
            <button
              onClick={() => onDeletePolygon(polygon.id)}
              className="text-red-500 hover:text-red-600 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}