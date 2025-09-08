export interface Coordinates {
  lng: number
  lat: number
}

export interface PolygonData {
  id: string
  name: string
  coordinates: Coordinates[]
  createdAt: string
}

export interface ViewState {
  longitude: number
  latitude: number
  zoom: number
}

export interface LocationState {
  userLocation: Coordinates | null
  locationError: string | null
  isGettingLocation: boolean
}

export interface PolygonState {
  isDrawing: boolean
  currentPolygon: Coordinates[]
  savedPolygons: PolygonData[]
  polygonName: string
}