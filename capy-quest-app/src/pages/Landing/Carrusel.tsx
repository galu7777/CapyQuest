'use client'

import React, { useState, useEffect } from 'react';

export default function Carrusel() {
  const [rotation, setRotation] = useState(0);

  const capybarasLeft = [
    { id: 1, color: 'bg-orange-200', image: '/img/capiGolden.jpeg' },
    { id: 2, color: 'bg-blue-200', image: '/img/capybaby.jpeg' },
    { id: 3, color: 'bg-orange-300', image: '/img/capyExplore.jpeg' },
    { id: 4, color: 'bg-purple-200', image: '/img/capygrandpa.jpeg' },
    { id: 5, color: 'bg-green-200', image: '/img/capyyound.jpeg' },
    { id: 6, color: 'bg-pink-200', image: '/img/capiGolden.jpeg' }
  ];

  const capybarasRight = [
    { id: 7, color: 'bg-yellow-200', image: '/img/capyyound.jpeg' },
    { id: 8, color: 'bg-red-200', image: '/img/capygrandpa.jpeg' },
    { id: 9, color: 'bg-teal-200', image: '/img/capyExplore.jpeg' },
    { id: 10, color: 'bg-indigo-200', image: '/img/capybaby.jpeg' },
    { id: 11, color: 'bg-lime-200', image: '/img/capiGolden.jpeg' },
    { id: 12, color: 'bg-rose-200', image: '/img/capyExplore.jpeg' }
  ];

  const nextSlide = () => setRotation((prev) => prev - 60);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderCarousel = (capybaras, side: "left" | "right") => (
    <div className="relative w-[380px] h-[500px]">
      {capybaras.map((capy, index) => {
        const angle = (index * 60 + rotation) * (Math.PI / 180);
        const radius = 260;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.6;

        const normalizedAngle = ((index * 60 + rotation) % 360 + 360) % 360;
        const distanceFromCenter = Math.min(
          Math.abs(normalizedAngle),
          Math.abs(normalizedAngle - 360)
        );

        const isVisible = distanceFromCenter <= 120;
        const opacity = isVisible ? Math.max(0.3, 1 - distanceFromCenter / 90) : 0;
        const zIndex = isVisible ? Math.round(100 - distanceFromCenter) : 0;
        const blur = isVisible ? Math.max(0, (distanceFromCenter / 60) * 4) : 0;

        const cardSize = 'w-32 h-32 md:w-40 md:h-40';

        return (
          <div
            key={capy.id}
            className={`absolute ${cardSize} rounded-2xl ${capy.color} shadow-lg transition-all duration-500 flex items-center justify-center overflow-hidden`}
            style={{
              [side]: '0%',
              top: '50%',
              transform: `translate(${side === "left" ? `calc(-50% + ${x}px)` : `calc(50% + ${-x}px)`}, calc(-50% + ${y}px))`,
              opacity,
              zIndex,
              filter: `blur(${blur}px)`
            }}
          >
            {/* Reemplazamos el emoji por una imagen */}
            <img
              src={capy.image}
              alt={`Capybara ${capy.id}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback en caso de que la imagen no exista
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-full h-full flex items-center justify-center text-2xl';
                e.currentTarget.parentNode?.appendChild(fallback);
              }}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-7xl">
        <div className="relative">
          <div className="relative h-[650px] overflow-hidden">

            {/* Carrusel Izquierdo */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {renderCarousel(capybarasLeft, "left")}
            </div>

            {/* Carrusel Derecho */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {renderCarousel(capybarasRight, "right")}
            </div>

            {/* Central Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 pointer-events-none">
              <div className="mb-4 w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                <img src="/img/capy.png" alt="capy" className="w-10 h-10" />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-2">
                Capy Coins
              </h1>
              <p className="text-gray-600 text-lg mb-8 max-w-md">
                Encuentra los diferentes tipos de capy en el mapa, para ganar capy coins.
              </p>
              <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition shadow-lg cursor-pointer pointer-events-auto">
                Buscar en el mapa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
