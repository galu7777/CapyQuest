import React from 'react'
import { Save, Trash2, Play, Square } from 'lucide-react'
import type { Coordinates } from '@/types/treasure-zone'

interface DrawingControlsProps {
  isDrawing: boolean
  currentPolygon: Coordinates[]
  polygonName: string
  onPolygonNameChange: (name: string) => void
  onStartDrawing: () => void
  onFinishDrawing: () => void
  onClearPolygon: () => void
  onSavePolygon: () => void
}

export const DrawingControls: React.FC<DrawingControlsProps> = ({
  isDrawing,
  currentPolygon,
  polygonName,
  onPolygonNameChange,
  onStartDrawing,
  onFinishDrawing,
  onClearPolygon,
  onSavePolygon
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-2 border-amber-200 rounded-2xl p-4">
      <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
        <Square className="w-5 h-5" />
        Dibujar Perímetro
      </h3>
      
      {!isDrawing ? (
        <button
          onClick={onStartDrawing}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-amber-900 hover:from-yellow-600 hover:to-yellow-500 font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Iniciar Dibujo
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-600 text-sm font-semibold">
              Modo dibujo activo - Toca el mapa para agregar puntos
            </p>
            <p className="text-blue-500 text-xs mt-1">
              Puntos: {currentPolygon.length}
            </p>
          </div>
          
          <input
            type="text"
            placeholder="Nombre del perímetro"
            value={polygonName}
            onChange={(e) => onPolygonNameChange(e.target.value)}
            className="w-full border-2 border-amber-300 rounded-xl p-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 focus:outline-none"
          />
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onFinishDrawing}
              disabled={currentPolygon.length < 3}
              className="bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500 font-semibold py-2 px-3 rounded-lg transition-all duration-200 text-sm disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Square className="w-3 h-3" />
              Terminar
            </button>
            <button
              onClick={onClearPolygon}
              className="bg-gradient-to-r from-gray-500 to-gray-400 text-white hover:from-gray-600 hover:to-gray-500 font-semibold py-2 px-3 rounded-lg transition-all duration-200 text-sm flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Limpiar
            </button>
          </div>
          
          {!isDrawing && currentPolygon.length >= 3 && (
            <button
              onClick={onSavePolygon}
              className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white hover:from-green-600 hover:to-green-500 font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar Perímetro
            </button>
          )}
        </div>
      )}
    </div>
  )
}