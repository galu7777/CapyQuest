import { useState, useCallback } from 'react'
import type { Coordinates, PolygonData } from '@/types/treasure-zone'

export const usePolygon = () => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPolygon, setCurrentPolygon] = useState<Coordinates[]>([])
  const [savedPolygons, setSavedPolygons] = useState<PolygonData[]>([])
  const [polygonName, setPolygonName] = useState('')

  const startDrawing = useCallback(() => {
    setIsDrawing(true)
    setCurrentPolygon([])
    setPolygonName('')
  }, [])

  const finishDrawing = useCallback(() => {
    if (currentPolygon.length < 3) {
      alert('Un polígono necesita al menos 3 puntos')
      return false
    }
    setIsDrawing(false)
    return true
  }, [currentPolygon.length])

  const addPoint = useCallback((coordinates: Coordinates) => {
    if (!isDrawing) return
    setCurrentPolygon(prev => [...prev, coordinates])
  }, [isDrawing])

  const clearCurrentPolygon = useCallback(() => {
    setCurrentPolygon([])
    setIsDrawing(false)
    setPolygonName('')
  }, [])

  const savePolygon = useCallback(() => {
    if (!polygonName.trim()) {
      alert('Por favor, ingresa un nombre para el polígono')
      return false
    }

    if (currentPolygon.length < 3) {
      alert('Un polígono necesita al menos 3 puntos')
      return false
    }

    const newPolygon: PolygonData = {
      id: Date.now().toString(),
      name: polygonName.trim(),
      coordinates: [...currentPolygon],
      createdAt: new Date().toISOString()
    }

    setSavedPolygons(prev => [...prev, newPolygon])
    setCurrentPolygon([])
    setPolygonName('')
    setIsDrawing(false)

    // Log coordinates to console for debugging
    console.log('Polígono guardado:', newPolygon)
    alert(`Polígono "${newPolygon.name}" guardado con ${newPolygon.coordinates.length} puntos`)
    return true
  }, [polygonName, currentPolygon])

  const deletePolygon = useCallback((id: string) => {
    setSavedPolygons(prev => prev.filter(p => p.id !== id))
  }, [])

  return {
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
  }
}