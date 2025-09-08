import React from 'react'
import { MapPin } from 'lucide-react'

export const Header: React.FC = () => {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-b-2 border-amber-200 shadow-lg p-4">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-500 bg-clip-text text-transparent text-center flex items-center justify-center gap-2">
        <MapPin className="w-6 h-6 text-yellow-500" />
        Treasure Zone
      </h1>
    </div>
  )
}