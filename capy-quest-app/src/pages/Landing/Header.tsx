'use client'

import { useState, useEffect } from 'react'
import './landing.css'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLoginClick = () => {
    alert('Redirigiendo a inicio de sesión...')
    // Aquí puedes agregar tu lógica de navegación
  }

  return (
    <>


      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          {/* Logo */}
          <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="logo-icon">₿</div>
            <span className="logo-text">Capi Coins</span>
          </div>

          {/* Navegación Desktop */}
          <nav className="nav">
            <ul className="nav-links">
              <li><a href="#inicio" className="nav-link">Inicio</a></li>
              <li><a href="#servicios" className="nav-link">Servicios</a></li>
              <li><a href="#nosotros" className="nav-link">Nosotros</a></li>
              <li><a href="#contacto" className="nav-link">Contacto</a></li>
            </ul>
            <a  href="/login" className="login-button" onClick={handleLoginClick}>
              Inicio de Sesión
            </a>
          </nav>

          {/* Botón menú móvil */}
          <button
            className={`mobile-menu-button ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="hamburger"></div>
          </button>
        </div>

        {/* Menú móvil */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul className="mobile-nav-links">
            <li>
              <a
                href="#inicio"
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Inicio
              </a>
            </li>
            <li>
              <a
                href="#servicios"
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Servicios
              </a>
            </li>
            <li>
              <a
                href="#nosotros"
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Nosotros
              </a>
            </li>
            <li>
              <a
                href="#contacto"
                className="mobile-nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contacto
              </a>
            </li>
          </ul>
          <button
            className="mobile-login-button"
            onClick={() => {
              handleLoginClick()
              setIsMobileMenuOpen(false)
            }}
          >
            Inicio de Sesión
          </button>
        </div>
      </header>
    </>
  )
}
