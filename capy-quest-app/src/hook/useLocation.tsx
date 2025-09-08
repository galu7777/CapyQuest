import { useState, useEffect, useCallback, useRef } from 'react'
import type { Coordinates, LocationState } from '@/types/treasure-zone'

export const useLocation = () => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('La geolocalización no está soportada por este navegador')
      return
    }

    setIsGettingLocation(true)
    setLocationError(null)

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // Cache por 1 minuto
    }

    const onSuccess = (position: GeolocationPosition) => {
      const coords: Coordinates = {
        lng: position.coords.longitude,
        lat: position.coords.latitude
      }
      
      setUserLocation(coords)
      setIsGettingLocation(false)
      setLocationError(null)
    }

    const onError = (error: GeolocationPositionError) => {
      setIsGettingLocation(false)
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setLocationError('Permiso de ubicación denegado')
          break
        case error.POSITION_UNAVAILABLE:
          setLocationError('Información de ubicación no disponible')
          break
        case error.TIMEOUT:
          setLocationError('Tiempo de espera agotado para obtener la ubicación')
          break
        default:
          setLocationError('Error desconocido al obtener la ubicación')
      }
    }

    // Watch position for real-time updates
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options)
  }, [])

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  // Start location tracking on mount
  useEffect(() => {
    startLocationTracking()
    return () => stopLocationTracking()
  }, [startLocationTracking, stopLocationTracking])

  return {
    userLocation,
    locationError,
    isGettingLocation,
    startLocationTracking,
    stopLocationTracking
  }
}