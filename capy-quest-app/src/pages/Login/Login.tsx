'use client'
import { useState } from 'react'
import './index.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Simular proceso de login
    setTimeout(() => {
      setIsLoading(false)
      alert('Login exitoso!')
    }, 1500)
  }


    const column1Images = [
    '/img/capybaby.jpeg',
    'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=400&h=400&fit=crop',
    '/img/capyExplore.jpeg',
    'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=400&fit=crop',
    '/img/capyyound.jpeg',
    'https://images.unsplash.com/photo-1605792657660-596af9009e82?w=400&h=400&fit=crop',
  ];

  const column2Images = [
    'https://images.unsplash.com/photo-1634704784915-aacf363b021f?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=400&h=400&fit=crop',
    '/img/capiGolden.jpeg',
    'https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=400&h=400&fit=crop',
    '/img/capyyound.jpeg',
  ];

  const column3Images = [
   'https://images.unsplash.com/photo-1634704784915-aacf363b021f?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=400&h=400&fit=crop',
    '/img/capiGolden.jpeg',
    'https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400&h=400&fit=crop',
  ];

  return (
    <>


      <div className="login-container">
        {/* Lado negro con formulario */}
        <div className="login-form-section">
          <div className="login-content">
            {/* Logo */}
            <div className="login-logo">
              <div className="login-logo-icon">₿</div>
              <span className="login-logo-text">Capi Coins</span>
            </div>

            {/* Título */}
            <h1 className="login-title">Bienvenido</h1>
            <p className="login-subtitle">Ingresa tus credenciales para continuar</p>

            {/* Formulario */}
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Contraseña
                </label>
                <div className="form-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Recordarme</span>
                </label>
                <a href="#" className="forgot-password">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type="submit"
                className={`login-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {!isLoading && 'Iniciar Sesión'}
              </button>
            </form>

            {/* Registro */}
            <p className="signup-prompt">
              ¿No tienes una cuenta?{' '}
              <a href="#" className="signup-link">
                Regístrate aquí
              </a>
            </p>
          </div>
        </div>

        {/* Lado con imagen */}
        <div className="login-image-section">



            <div className="carousel-column left-carrusel">
                {[...column1Images, ...column1Images].map((img, index) => (
                  <div key={`col1-${index}`} className="image-container">
                    <img src={img} alt={`Crypto ${index + 1}`} />
                  </div>
                ))}
              </div>

              {/* Columna 2 */}
              <div className="carousel-column">
                {[...column2Images, ...column2Images].map((img, index) => (
                  <div key={`col2-${index}`} className="image-container">
                    <img src={img} alt={`NFT ${index + 1}`} />
                  </div>
                ))}
              </div>

              {/* Columna 3 */}
              <div className="carousel-column">
                {[...column3Images, ...column3Images].map((img, index) => (
                  <div key={`col3-${index}`} className="image-container">
                    <img src={img} alt={`Blockchain ${index + 1}`} />
                  </div>
                ))}
              </div>


                <div className="carousel-column">
                {[...column3Images, ...column3Images].map((img, index) => (
                  <div key={`col3-${index}`} className="image-container">
                    <img src={img} alt={`Blockchain ${index + 1}`} />
                  </div>
                ))}
              </div>



          </div>

      </div>
    </>
  )
}
