'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { MapPin, Navigation, Trash2, Play, ChartNetwork, 
  Loader, Trophy, Zap, Target, Map as MapIcon, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useNFTDistributed } from '@/hook/useNFTDistributed'
import Image from 'next/image'
import Capy from "@/assets/capy-white.png"
import type { Feature, FeatureCollection, Polygon } from 'geojson'

// Importar las descripciones de NFTs
import { descNFTs } from '@/constant/descNFTs'

// Importar imágenes específicas para cada tipo de NFT
import BabyCapyImage from "@/assets/NFTs/BabyCapy.png"
import ExploreCapyImage from "@/assets/NFTs/ExploreCapy.png"
import WiseCapyImage from "@/assets/NFTs/WiseCapy.png"
import LegendaryCapyImage from "@/assets/NFTs/LegendaryCapy.png"
import GoldenCapyImage from "@/assets/NFTs/GoldenCapy.png"

interface Coordinates {
  lng: number
  lat: number
}

interface PolygonData {
  id: string
  name: string
  coordinates: Coordinates[]
  createdAt: string
}

// Configuración de Mapbox
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'your_mapbox_token_here'
const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v11'

// Mapeo de rarezas a imágenes (solo para vista de detalle)
const rarityImages = {
  0: BabyCapyImage,
  1: ExploreCapyImage,
  2: WiseCapyImage,
  3: LegendaryCapyImage,
  4: GoldenCapyImage
}

// Mapeo de rarezas a nombres
const rarityNames = {
  0: "Capy Bebe",
  1: "Capy Explorador", 
  2: "Capy Sabio",
  3: "Capy Legendario",
  4: "Capy Dorado"
}

export default function TreasureZoneImproved() {
  // Estados principales
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [viewState, setViewState] = useState({
    longitude: -122.4,
    latitude: 37.8,
    zoom: 14
  })
  
  // Estados de dibujo y polígonos
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPolygon, setCurrentPolygon] = useState<Coordinates[]>([])
  const [savedPolygons, setSavedPolygons] = useState<PolygonData[]>([])
  const [polygonName, setPolygonName] = useState('')
  
  // Estados de distribución
  const [distributionMode, setDistributionMode] = useState<'single' | 'polygon'>('single')
  const [selectedNFTs, setSelectedNFTs] = useState<bigint[]>([])
  const [showNFTSelector, setShowNFTSelector] = useState(false)
  //const [selectedPolygonForDistribution, setSelectedPolygonForDistribution] = useState<PolygonData | null>(null)
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<'distribute' | 'polygons' | 'active'>('distribute')
  const [locationError, setLocationError] = useState<string | null>(null)
  //const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [pendingClickLocation, setPendingClickLocation] = useState<Coordinates | null>(null)
  const [showDistributionMenu, setShowDistributionMenu] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<any>(null)
  const [showLocationStatus, setShowLocationStatus] = useState(true)
  const [showNFTDetail, setShowNFTDetail] = useState(false)
  
  const mapRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)

  // Usar el hook para NFT distribuidos
  const { 
    nftState, 
    loading, 
    distributeNFT, 
    claimNFT, 
    generateRandomLocationInPolygon, 
    calculateDistance 
  } = useNFTDistributed()

  // Geolocalización
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('La geolocalización no está soportada por este navegador')
      return
    }

    //setIsGettingLocation(true)
    setLocationError(null)

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }

    const onSuccess = (position: GeolocationPosition) => {
      const coords = {
        lng: position.coords.longitude,
        lat: position.coords.latitude
      }
      
      setUserLocation(coords)
      setViewState(prev => ({
        ...prev,
        longitude: coords.lng,
        latitude: coords.lat,
        zoom: 16
      }))
      //setIsGettingLocation(false)
      setLocationError(null)
    }

    const onError = (error: GeolocationPositionError) => {
      //setIsGettingLocation(false)
      setLocationError('No se pudo obtener la ubicación: ' + error.message)
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
  }, [])

  useEffect(() => {
    startLocationTracking()
    
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [startLocationTracking])

  // Manejo de clics en el mapa
  const handleMapClick = useCallback((event: any) => {
    if (!event.lngLat) return
    
    const { lng, lat } = event.lngLat
    
    if (isDrawing) {
      setCurrentPolygon(prev => [...prev, { lng, lat }])
    } else if (distributionMode === 'single' && selectedNFTs.length > 0 && activeTab === 'distribute') {
      setPendingClickLocation({ lng, lat })
      setShowDistributionMenu(true)
    }
  }, [isDrawing, distributionMode, selectedNFTs, activeTab])

  // Distribución de NFTs
  const distributeNFTsAtLocation = useCallback(async (location: Coordinates) => {
    if (selectedNFTs.length === 0) {
      alert('Selecciona al menos un NFT para distribuir')
      return
    }

    try {
      for (const tokenId of selectedNFTs) {
        const locationString = `${location.lat.toFixed(6)},${location.lng.toFixed(6)}`
        const result = await distributeNFT(tokenId, locationString)
        if (!result.success) {
          alert(`Error distribuyendo NFT ${tokenId.toString()}: ${result.error}`)
          break
        }
      }
      alert(`${selectedNFTs.length} NFT(s) distribuidos exitosamente!`)
      setSelectedNFTs([])
      setPendingClickLocation(null)
      setShowDistributionMenu(false)
    } catch (error) {
      alert('Error durante la distribución')
    }
  }, [selectedNFTs, distributeNFT])

  const distributeNFTsInPolygon = useCallback(async (polygon: PolygonData) => {
    if (selectedNFTs.length === 0) {
      alert('Selecciona al menos un NFT para distribuir')
      return
    }

    try {
      for (const tokenId of selectedNFTs) {
        const location = generateRandomLocationInPolygon(polygon.coordinates)
        const result = await distributeNFT(tokenId, location)
        if (!result.success) {
          alert(`Error distribuyendo NFT ${tokenId.toString()}: ${result.error}`)
          break
        }
      }
      alert(`${selectedNFTs.length} NFT(s) distribuidos aleatoriamente en ${polygon.name}!`)
      setSelectedNFTs([])
      //setSelectedPolygonForDistribution(null)
    } catch (error) {
      alert('Error durante la distribución: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }, [selectedNFTs, generateRandomLocationInPolygon, distributeNFT])

  // Manejo de polígonos
  const startDrawing = () => {
    setIsDrawing(true)
    setCurrentPolygon([])
    setPolygonName('')
  }

  const finishDrawing = () => {
    if (currentPolygon.length < 3) {
      alert('Un polígono necesita al menos 3 puntos')
      return
    }
    setIsDrawing(false)
  }

  const savePolygon = () => {
    if (!polygonName.trim()) {
      alert('Por favor, ingresa un nombre para el polígono')
      return
    }

    if (currentPolygon.length < 3) {
      alert('Un polígono necesita al menos 3 puntos')
      return
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
    alert(`Polígono "${newPolygon.name}" guardado!`)
  }

  const clearCurrentPolygon = () => {
    setCurrentPolygon([])
    setIsDrawing(false)
    setPolygonName('')
  }

  // Reclamar NFT
  const handleClaimNFT = async (nft: any) => {
    if (!userLocation) {
      alert('Necesitas activar tu ubicación para reclamar NFTs')
      return
    }

    const [lat, lng] = nft.location.split(',').map(parseFloat)
    const nftLocation = { lat, lng }
    const distance = calculateDistance(userLocation, nftLocation)
    
    if (distance > 150000) {
      console.log('Distance:', distance)
      alert(`Estás a ${distance.toFixed(2)} metros del NFT. Debes estar dentro de 1 metros para reclamarlo.`)
      return
    }

    const result = await claimNFT(nft.tokenId, nft.location)
    if (result.success) {
      alert('NFT reclamado exitosamente!')
      setShowNFTDetail(false)
    } else {
      alert(`Error al reclamar el NFT: ${result.error}`)
    }
  }

  // Verificar proximidad al hacer clic en un NFT
  const handleNFTMarkerClick = async (nft: any) => {
    if (!userLocation) {
      alert('Necesitas activar tu ubicación para interactuar con NFTs')
      return
    }

    const [lat, lng] = nft.location.split(',').map(parseFloat)
    const nftLocation = { lat, lng }
    const distance = calculateDistance(userLocation, nftLocation)
    
    if (distance <= 150000) {
      setSelectedNFT(nft)
      setShowNFTDetail(true)
    } else {
      alert(`Estás a ${distance.toFixed(2)} metros del NFT. Debes estar dentro de 1 metros para interactuar con él.`)
    }
  }

  // Obtener imagen según la rareza del NFT (solo para vista de detalle)
  const getNFTImage = (rarity: number) => {
    return rarityImages[rarity as keyof typeof rarityImages] || Capy
  }

  // Obtener nombre según la rareza del NFT
  const getNFTName = (rarity: number) => {
    return rarityNames[rarity as keyof typeof rarityNames] || "Capy"
  }

  // Obtener descripción según la rareza del NFT
  const getNFTDescription = (rarity: number) => {
    return descNFTs[rarity]?.description || "Este es un NFT especial de Capy. Coleccíonalo y forma parte de la comunidad de cazadores de tesoros."
  }

  // Generar GeoJSON para el polígono actual
  const getPolygonGeoJSON = () => {
    if (currentPolygon.length < 3) return null
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[...currentPolygon.map(coord => [coord.lng, coord.lat]), [currentPolygon[0].lng, currentPolygon[0].lat]]]
      },
      properties: {}
    }
  }

  // Generar GeoJSON para polígonos guardados
  const getSavedPolygonsGeoJSON = (): Feature<Polygon>[] => {
  return savedPolygons.map(polygon => ({
    type: "Feature", // 👈 importante que sea string literal
    geometry: {
      type: "Polygon",
      coordinates: [[
        ...polygon.coordinates.map(coord => [coord.lng, coord.lat]),
        [polygon.coordinates[0].lng, polygon.coordinates[0].lat] // cierre del polígono
      ]]
    },
    properties: {
      name: polygon.name,
      id: polygon.id
    }
  }))
}

  // Vista de detalle del NFT
  if (showNFTDetail && selectedNFT) {
    const nftImage = getNFTImage(selectedNFT.rarity)
    const nftName = getNFTName(selectedNFT.rarity)
    const nftDescription = getNFTDescription(selectedNFT.rarity)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-4 flex items-center justify-between">
            <button 
              onClick={() => setShowNFTDetail(false)}
              className="text-white p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">Detalle del NFT</h1>
            <div className="w-9"></div> {/* Spacer para centrar el título */}
          </div>
          
          {/* NFT Content */}
          <div className="p-6">
            <div className="w-32 h-32 mx-auto rounded-full border-4 border-yellow-400 shadow-lg overflow-hidden mb-6">
              <Image 
                src={nftImage} 
                alt={nftName}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-amber-800 mb-2">{nftName}</h2>
              <p className="text-amber-600">Token ID: #{selectedNFT.tokenId.toString()}</p>
              <p className="text-amber-500 text-sm mt-1">
                Rareza: {selectedNFT.rarityName}
              </p>
            </div>
            
            <div className="bg-amber-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-amber-800 mb-2">Descripción</h3>
              <p className="text-amber-700 text-sm">
                {nftDescription}
              </p>
            </div>
            
            <button
              onClick={() => handleClaimNFT(selectedNFT)}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-green-700 transition-all"
            >
              <Zap className="w-5 h-5" />
              Reclamar NFT
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header Mobile */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-amber-200 shadow-sm p-3">
        <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-orange-500 bg-clip-text text-transparent text-center flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Treasure Zone
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-amber-100 px-2 py-2">
        <div className="flex rounded-xl bg-amber-50 p-1">
          {[
            { id: 'distribute', label: 'Distribuir', icon: Target },
            { id: 'polygons', label: 'Perímetros', icon: ChartNetwork },
            { id: 'active', label: 'En Mapa', icon: MapIcon }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-yellow-400 text-amber-900 shadow-sm'
                  : 'text-amber-700 hover:bg-yellow-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map Container - Ocupa todo el espacio restante */}
      <div className="fixed top-24 bottom-0 left-0 right-0">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          mapStyle={MAPBOX_STYLE}
          onClick={handleMapClick}
        >
          {/* User Location */}
          {userLocation && (
            <Marker
              longitude={userLocation.lng}
              latitude={userLocation.lat}
              anchor="center"
            >
              <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg animate-pulse"></div>
            </Marker>
          )}
          
          {/* Current Polygon Drawing - Solo visible en pestaña Perímetros */}
          {activeTab === 'polygons' && currentPolygon.length > 0 && (
            <Source
              id="current-polygon"
              type="geojson"
              data={getPolygonGeoJSON() as any}
            >
              <Layer
                id="current-polygon-layer"
                type="line"
                paint={{
                  'line-color': '#f59e0b',
                  'line-width': 3,
                  'line-dasharray': [2, 2]
                }}
              />
            </Source>
          )}
          
          {/* Saved Polygons - Solo visible en pestaña Perímetros */}
          {activeTab === 'polygons' && savedPolygons.length > 0 && (
            <Source
              id="saved-polygons"
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: getSavedPolygonsGeoJSON()
              } as FeatureCollection}
            >
              <Layer
                id="saved-polygons-layer"
                type="fill"
                paint={{
                  'fill-color': '#f59e0b',
                  'fill-opacity': 0.1
                }}
              />
              <Layer
                id="saved-polygons-outline"
                type="line"
                paint={{
                  'line-color': '#f59e0b',
                  'line-width': 2
                }}
              />
            </Source>
          )}
          
          {/* Distributed NFTs - Solo visible en pestaña En Mapa */}
          {activeTab === 'active' && nftState.distributedNFTs.map((nft) => {
            const [lat, lng] = nft.location.split(',').map(parseFloat)
            
            return (
              <Marker
                key={nft.tokenId.toString()}
                longitude={lng}
                latitude={lat}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation()
                  handleNFTMarkerClick(nft)
                }}
              >
                <div className="w-10 h-10 rounded-full border-2 border-yellow-400 overflow-hidden shadow-lg">
                  <Image 
                    src={Capy}
                    alt="NFT" 
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Marker>
            )
          })}
          
          {/* Pending Click Location - Solo visible en pestaña Distribuir */}
          {activeTab === 'distribute' && pendingClickLocation && (
            <Marker
              longitude={pendingClickLocation.lng}
              latitude={pendingClickLocation.lat}
              anchor="center"
            >
              <div className="w-8 h-8 bg-red-500 border-4 border-white rounded-full shadow-lg animate-bounce"></div>
            </Marker>
          )}
        </Map>
        
        {/* Location Status - Esquina superior derecha dentro del mapa */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
          <div className="flex items-center gap-2">
            <Navigation className={`w-4 h-4 ${userLocation ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700">
              {userLocation ? 'Ubicación Activa' : 'Ubicación Inactiva'}
            </span>
            <button 
              onClick={() => setShowLocationStatus(!showLocationStatus)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showLocationStatus ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          
          {showLocationStatus && (
            <div className="mt-2">
              {locationError ? (
                <p className="text-red-500 text-xs">{locationError}</p>
              ) : userLocation ? (
                <p className="text-green-600 text-xs font-mono">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
              ) : (
                <p className="text-gray-500 text-xs">Obteniendo ubicación...</p>
              )}
            </div>
          )}
        </div>

        {/* Controles específicos por pestaña */}
        
        {/* Pestaña Distribuir */}
        {activeTab === 'distribute' && (
          <>
            {/* Distribution Mode Panel - Debajo del indicador de ubicación */}
            <div className="absolute top-20 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md w-48">
              <h3 className="font-semibold text-amber-800 mb-2 text-sm">Modo de Distribución</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setDistributionMode('single')}
                  className={`w-full p-2 rounded-lg border transition-all flex items-center gap-2 ${
                    distributionMode === 'single'
                      ? 'border-yellow-400 bg-yellow-50 text-amber-800'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span className="text-xs">Punto Específico</span>
                </button>
                <button
                  onClick={() => setDistributionMode('polygon')}
                  className={`w-full p-2 rounded-lg border transition-all flex items-center gap-2 ${
                    distributionMode === 'polygon'
                      ? 'border-yellow-400 bg-yellow-50 text-amber-800'
                      : 'border-gray-300 bg-white text-gray-700'
                  }`}
                >
                  <ChartNetwork className="w-4 h-4" />
                  <span className="text-xs">Perímetro</span>
                </button>
              </div>
            </div>

            {/* NFT Selection Panel - Esquina superior izquierda */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md overflow-hidden w-64">
              <div 
                className="p-3 flex items-center justify-between cursor-pointer"
                onClick={() => setShowNFTSelector(!showNFTSelector)}
              >
                <h3 className="font-semibold text-amber-800 text-sm">Mis NFTs ({nftState.userNFTs.length})</h3>
                {showNFTSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
              
              {showNFTSelector && (
                <div className="max-h-60 overflow-y-auto border-t">
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <Loader className="w-5 h-5 animate-spin text-yellow-500" />
                    </div>
                  ) : nftState.userNFTs.filter(nft => !nft.isActiveOnMap).length === 0 ? (
                    <p className="p-3 text-amber-600 text-xs">No tienes NFTs disponibles para distribuir</p>
                  ) : (
                    <div className="space-y-1 p-2">
                      {nftState.userNFTs.filter(nft => !nft.isActiveOnMap).map(nft => {
                        const nftImage = getNFTImage(nft.rarity)
                        const nftName = getNFTName(nft.rarity)
                        
                        return (
                          <div
                            key={nft.tokenId.toString()}
                            onClick={() => {
                              const tokenId = nft.tokenId
                              setSelectedNFTs(prev => 
                                prev.includes(tokenId) 
                                  ? prev.filter(id => id !== tokenId)
                                  : [...prev, tokenId]
                              )
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                              selectedNFTs.includes(nft.tokenId)
                                ? 'bg-yellow-100 border border-yellow-300'
                                : 'bg-amber-50 hover:bg-yellow-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full border-2 border-yellow-400 overflow-hidden">
                                <Image 
                                  src={nftImage} 
                                  alt={nftName}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-medium text-amber-800 text-xs">{nftName}</p>
                                <p className="text-amber-600 text-xs">#{nft.tokenId.toString()}</p>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedNFTs.includes(nft.tokenId)
                                ? 'border-yellow-500 bg-yellow-500'
                                : 'border-amber-300'
                            }`}>
                              {selectedNFTs.includes(nft.tokenId) && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {selectedNFTs.length > 0 && (
                    <div className="p-2 bg-yellow-50 border-t">
                      <p className="text-xs text-yellow-700 text-center">
                        {selectedNFTs.length} NFT(s) seleccionado(s)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Distribution Actions - Aparece solo cuando hay NFTs seleccionados */}
            {selectedNFTs.length > 0 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-3 shadow-lg max-w-md">
                <p className="text-amber-900 text-sm font-medium text-center">
                  {distributionMode === 'single' 
                    ? `Toca el mapa para distribuir ${selectedNFTs.length} NFT(s)`
                    : `Selecciona un perímetro para distribuir ${selectedNFTs.length} NFT(s)`
                  }
                </p>
                
                {distributionMode === 'polygon' && savedPolygons.length > 0 && (
                  <div className="mt-2 bg-white/30 rounded-lg p-2">
                    <p className="text-amber-900 text-xs font-medium mb-1">Perímetros disponibles:</p>
                    <div className="flex gap-2 overflow-x-auto">
                      {savedPolygons.map(polygon => (
                        <button
                          key={polygon.id}
                          onClick={() => distributeNFTsInPolygon(polygon)}
                          disabled={loading}
                          className="flex-shrink-0 bg-white/90 px-2 py-1 rounded text-xs font-medium text-amber-800 hover:bg-white transition-all"
                        >
                          {polygon.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Pestaña Perímetros */}
        {activeTab === 'polygons' && (
          <>
            {/* Drawing Controls - Esquina superior derecha */}
            <div className="absolute top-20 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md w-48">
              <h3 className="font-semibold text-amber-800 mb-2 text-sm">Crear Perímetro</h3>
              
              {!isDrawing ? (
                <button
                  onClick={startDrawing}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-amber-900 font-semibold py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Play className="w-4 h-4" />
                  Empezar a Dibujar
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <p className="text-blue-600 text-xs font-semibold">
                      Dibujando - Toca el mapa
                    </p>
                    <p className="text-blue-500 text-xs">
                      Puntos: {currentPolygon.length} {currentPolygon.length >= 3 && '✓'}
                    </p>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Nombre del perímetro"
                    value={polygonName}
                    onChange={(e) => setPolygonName(e.target.value)}
                    className="w-full border border-amber-300 rounded-lg p-2 text-sm focus:border-yellow-500 focus:outline-none"
                  />
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={finishDrawing}
                      disabled={currentPolygon.length < 3}
                      className="bg-orange-500 text-white py-1 px-1 rounded text-xs disabled:opacity-50"
                    >
                      Terminar
                    </button>
                    <button
                      onClick={savePolygon}
                      disabled={!polygonName.trim() || currentPolygon.length < 3}
                      className="bg-green-500 text-white py-1 px-1 rounded text-xs disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={clearCurrentPolygon}
                      className="bg-gray-500 text-white py-1 px-1 rounded text-xs"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Saved Polygons - Esquina superior izquierda */}
            {savedPolygons.length > 0 && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md overflow-hidden w-64 max-h-80">
                <h3 className="font-semibold text-amber-800 p-3 text-sm border-b">Perímetros Guardados</h3>
                <div className="overflow-y-auto max-h-60">
                  {savedPolygons.map(polygon => (
                    <div key={polygon.id} className="flex items-center justify-between p-2 border-b">
                      <div>
                        <p className="font-medium text-amber-800 text-xs">{polygon.name}</p>
                        <p className="text-amber-600 text-xs">{polygon.coordinates.length} puntos</p>
                      </div>
                      <button
                        onClick={() => setSavedPolygons(prev => prev.filter(p => p.id !== polygon.id))}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Pestaña En Mapa */}
        {activeTab === 'active' && (
          <>
            {/* Active NFTs Panel - Esquina superior izquierda */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md overflow-hidden w-64">
              <h3 className="font-semibold text-amber-800 p-3 text-sm border-b">
                NFTs en el Mapa ({nftState.distributedNFTs.length})
              </h3>
              
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader className="w-5 h-5 animate-spin text-yellow-500" />
                </div>
              ) : nftState.distributedNFTs.length === 0 ? (
                <p className="p-3 text-amber-600 text-xs">No hay NFTs distribuidos en el mapa</p>
              ) : (
                <div className="overflow-y-auto max-h-60">
                  {nftState.distributedNFTs.map(nft => {
                    const nftName = getNFTName(nft.rarity)
                    
                    return (
                      <div key={nft.tokenId.toString()} className="flex items-center justify-between p-2 border-b">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full border-2 border-yellow-400 overflow-hidden">
                            <Image 
                              src={Capy}
                              alt={nftName}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-amber-800 text-xs">Capybara NFT</p>
                            {/* <p className="text-amber-600 text-xs"># ???</p> */}
                          </div>
                        </div>
                        <button
                          onClick={() => handleNFTMarkerClick(nft)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-blue-600"
                        >
                          <MapPin className="w-3 h-3" />
                          Ver
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Map Instructions - Esquina inferior derecha */}
        <div className="absolute bottom-4 right-4 bg-black/70 text-white rounded-lg p-2 max-w-xs">
          <p className="text-xs">
            {activeTab === 'polygons' && isDrawing 
              ? 'Haz clic en el mapa para agregar puntos al polígono' 
              : activeTab === 'distribute' && distributionMode === 'single' && selectedNFTs.length > 0
              ? 'Haz clic en el mapa para distribuir NFTs'
              : activeTab === 'distribute' && distributionMode === 'polygon' && selectedNFTs.length > 0
              ? 'Selecciona un perímetro para distribuir NFTs'
              : 'Explora el mapa para encontrar NFTs'
            }
          </p>
        </div>
      </div>

      {/* Distribution Confirmation Modal */}
      {showDistributionMenu && pendingClickLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full">
            <div className="text-center mb-4">
              <Target className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
              <h3 className="font-semibold text-lg text-amber-800">Confirmar Distribución</h3>
              <p className="text-gray-600 text-sm">
                ¿Distribuir {selectedNFTs.length} NFT(s) en esta ubicación?
              </p>
              <div className="mt-2 p-2 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-700 font-mono">
                  {pendingClickLocation.lat.toFixed(6)}, {pendingClickLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => distributeNFTsAtLocation(pendingClickLocation)}
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {loading ? 'Distribuyendo...' : 'Confirmar'}
              </button>
              
              <button
                onClick={() => {
                  setPendingClickLocation(null)
                  setShowDistributionMenu(false)
                }}
                disabled={loading}
                className="w-full bg-gray-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-3">
            <Loader className="w-6 h-6 animate-spin text-yellow-500" />
            <span className="font-medium text-amber-800">Procesando transacción...</span>
          </div>
        </div>
      )}
    </div>
  )
}