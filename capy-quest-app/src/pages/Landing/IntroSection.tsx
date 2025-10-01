import { useEffect, useRef } from 'react'
import Image from 'next/image';

export default function IntroSection() {
  const introRef = useRef(null)
  const videoRef = useRef(null)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const descriptionRef = useRef(null)
  const scrollIndicatorRef = useRef(null)

  useEffect(() => {
    // Animaciones de entrada
    const timeline = [
      { element: titleRef.current, delay: 0.3, x: -50 },
      { element: subtitleRef.current, delay: 0.6, x: -30 },
      { element: descriptionRef.current, delay: 0.9, x: -20 },
      { element: videoRef.current?.parentElement, delay: 0.5, x: 50 }
    ]

    timeline.forEach(({ element, delay, x }) => {
      if (element) {
        element.style.opacity = '0'
        element.style.transform = `translateX(${x}px)`

        setTimeout(() => {
          element.style.transition = 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          element.style.opacity = '1'
          element.style.transform = 'translateX(0)'
        }, delay * 1000)
      }
    })

    // Reproducir video
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log('Autoplay prevented:', error)
      })
    }

    // Animación del scroll indicator
    const animateScroll = () => {
      if (scrollIndicatorRef.current) {
        scrollIndicatorRef.current.style.animation = 'bounce 2s ease-in-out infinite'
      }
    }
    setTimeout(animateScroll, 2000)
  }, [])

  const handleScrollClick = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    })
  }

  return (
    <>
      <section ref={introRef} className="intro-section">
        <div className="intro-container">
          {/* Contenido de texto */}
          <div className="intro-content">
            <h1 ref={titleRef} className="intro-title">Capi Coins</h1>
            <p ref={subtitleRef} className="intro-subtitle">
              Tu solución en criptomonedas
            </p>
            <p ref={descriptionRef} className="intro-description">
              Facilitamos tus transacciones en el mundo cripto. Compra, vende e intercambia
              criptomonedas de forma segura, rápida y confiable. Tu puerta de entrada al
              futuro financiero digital.
            </p>
           <div className="svg-container flex justify-center">
              <Image
                src="/icons/svg/capymap.png"
                alt=""
                width={120}
                height={120}
                className="colored-svg"
              />
            </div>
          </div>

          {/* Video */}
          <div className="video-wrapper">
            <div className="video-glow">
              <video
                ref={videoRef}
                className="intro-video"
                autoPlay
                muted
                loop
                playsInline
              >
                <source src="/movies/test.mp4" type="video/mp4" />
                Tu navegador no soporta el elemento video.
              </video>
            </div>
          </div>
        </div>

        {/* Indicador de scroll */}
        <div
          ref={scrollIndicatorRef}
          className="scroll-indicator"
          onClick={handleScrollClick}
        >

          <div className="scroll-icon"></div>
        </div>
      </section>
    </>
  )
}
