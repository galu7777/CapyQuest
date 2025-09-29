'use client'

import { useEffect, useRef } from 'react'
import SplitType from 'split-type'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import * as THREE from 'three'
import './landing.css'

gsap.registerPlugin(ScrollTrigger)

export default function Landing() {
  const rootRef = useRef<HTMLDivElement>(null)
  const modelContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current!
    const modelContainer = modelContainerRef.current!
    if (!root || !modelContainer) return

    // Smooth scroll (Lenis) + sincronía con ScrollTrigger
    const lenis = new Lenis()
    const raf = (time: number) => {
      lenis.raf(time)
      requestId = requestAnimationFrame(raf)
    }
    let requestId = requestAnimationFrame(raf)
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.lagSmoothing(0)

    // Split de texto (sustituto de SplitText)
    const headerSplit = new SplitType(root.querySelector('.header-1 h1') as Element, {
      types: 'chars',
      tagName: 'span',
    })
    const titleSplits = Array.from(root.querySelectorAll('.tooltip .title h2')).map(
      (el) => new SplitType(el as Element, { types: 'lines', tagName: 'span' })
    )
    const descriptionSplits = Array.from(root.querySelectorAll('.tooltip .description p')).map(
      (el) => new SplitType(el as Element, { types: 'lines', tagName: 'span' })
    )

    // Envolver chars/lines en un <span> adicional para animar como tu CSS espera
    headerSplit.chars.forEach((char) => {
      char.innerHTML = `<span>${char.textContent}</span>`
    })
    ;[...titleSplits, ...descriptionSplits].forEach((split) => {
      split.lines?.forEach((line) => (line.innerHTML = `<span>${line.textContent}</span>`))
    })

    const animOptions = { duration: 1, ease: 'power3.out', stagger: 0.025 }
    const tooltipSelectors = [
      {
        trigger: 0.65,
        elements: root.querySelectorAll(
          '.tooltip:nth-child(1) .icon ion-icon, .tooltip:nth-child(1) .title .line > span, .tooltip:nth-child(1) .description .line > span'
        ),
      },
      {
        trigger: 0.85,
        elements: root.querySelectorAll(
          '.tooltip:nth-child(2) .icon ion-icon, .tooltip:nth-child(2) .title .line > span, .tooltip:nth-child(2) .description .line > span'
        ),
      },
    ] as const

    // --------- THREE.JS ----------
    let model: THREE.Object3D | null = null
    let currentRotation = 0
    let modelSize: THREE.Vector3 | null = null
    let rafId = 0

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setClearColor(0x000000, 0)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // Actual en Three r160+: usar outputColorSpace
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NoToneMapping
    renderer.toneMappingExposure = 1.0
    modelContainer.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.7))

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0)
    mainLight.position.set(1, 2, 3)
    mainLight.castShadow = true
    mainLight.shadow.bias = -0.001
    mainLight.shadow.mapSize.set(1024, 1024)
    scene.add(mainLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5)
    fillLight.position.set(-2, 0, -2)
    scene.add(fillLight)

    const setupModel = () => {
      if (!model || !modelSize) return
      const isMobile = window.innerWidth < 1000
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())

      model.position.set(
        isMobile ? center.x + modelSize.x * 1.5 : -center.x - modelSize.x * -0.2,
        -center.y + modelSize.y * 0.085,
        -center.z
      )

      model.rotation.z = isMobile ? 0 : THREE.MathUtils.degToRad(-25)

      const cameraDistance = isMobile ? 2 : 1.25
      camera.position.set(0, 0, Math.max(modelSize.x, modelSize.y, modelSize.z) * cameraDistance)
      camera.lookAt(0, 0, 0)
    }

    ;(async () => {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const loader = new GLTFLoader()
      loader.load(
        './models/CapyBaby.glb',
        (gltf) => {
          model = gltf.scene
          model.traverse((node: any) => {
            if (node.isMesh && node.material) {
              node.material.metalness = 0.05
              node.material.roughness = 0.9
            }
          })
          const box = new THREE.Box3().setFromObject(model!)
          modelSize = box.getSize(new THREE.Vector3())
          scene.add(model!)
          setupModel()
        },
        undefined,
        (err) => console.error('Error cargando GLB:', err)
      )
    })()

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      setupModel()
    }
    window.addEventListener('resize', onResize)

    // --------- GSAP / ScrollTrigger ----------
    ScrollTrigger.create({
      trigger: root.querySelector('.product-overview')!,
      start: '75% bottom',
      onEnter: () =>
        gsap.to(root.querySelectorAll('.header-1 h1 .char > span'), {
          y: '0%',
          duration: 1,
          ease: 'power3.out',
          stagger: 0.025,
        }),
      onLeaveBack: () =>
        gsap.to(root.querySelectorAll('.header-1 h1 .char > span'), {
          y: '100%',
          duration: 1,
          ease: 'power3.out',
          stagger: 0.025,
        }),
    })

    ScrollTrigger.create({
  trigger: root.querySelector('.product-overview')!,
  start: 'top top',
  end: `+=${window.innerHeight * 10}px`,
  pin: true,
  pinSpacing: true,
  scrub: 1,
  onUpdate: ({ progress }) => {
    const headerProgress = Math.max(0, Math.min(1, (progress - 0.05) / 0.3))
    gsap.to(root.querySelector('.header-1')!, {
      xPercent: progress < 0.05 ? 0 : progress > 0.35 ? -100 : -100 * headerProgress,
    })

    const maskSize =
      progress < 0.2 ? 0 : progress > 0.3 ? 100 : 100 * ((progress - 0.2) / 0.1)
    gsap.to(root.querySelector('.circular-mask')!, {
      clipPath: `circle(${maskSize}% at 50% 50%)`,
    })

    // NUEVO: Controlar la visibilidad y animación de los tooltips
    const tooltipsElement = root.querySelector('.tooltips')!

    // Cuando el círculo llega al 100% (progress > 0.3), mostrar tooltips
    if (progress > 0.3) {
      // Hacer visible
      tooltipsElement.classList.add('visible')

      // Animación de desplazamiento hacia arriba
      gsap.to(tooltipsElement, {
        y: 0, // Posición final
        opacity: 1,
        duration: 1,
        ease: 'power3.out'
      })
    } else {
      // Ocultar cuando el círculo no está al 100%
      tooltipsElement.classList.remove('visible')
      gsap.to(tooltipsElement, {
        y: 100, // Posición inicial (más abajo)
        opacity: 0,
        duration: 0.5,
        ease: 'power3.in'
      })
    }

    const header2Progress = (progress - 0.15) / 0.35
    const header2XPercent =
      progress < 0.15 ? 100 : progress > 0.5 ? -200 : 100 - 300 * header2Progress
    gsap.to(root.querySelector('.header-2')!, { xPercent: header2XPercent })

    const scaleX =
      progress < 0.45 ? 0 : progress > 0.65 ? 100 : 100 * ((progress - 0.45) / 0.2)
    gsap.to(root.querySelectorAll('.tooltip .divider'), { scaleX: `${scaleX}%`, ...animOptions })

    tooltipSelectors.forEach(({ trigger, elements }) => {
      gsap.to(elements, {
        y: progress >= trigger ? '0%' : '125%',
        ...animOptions,
      })
    })

    if (model && progress >= 0.05) {
      const rotationProgress = (progress - 0.05) / 0.95
      const targetRotation = Math.PI * 3 * 4 * rotationProgress
      const rotationDiff = targetRotation - currentRotation
      if (Math.abs(rotationDiff) > 0.001) {
        ;(model as THREE.Object3D).rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationDiff)
        currentRotation = targetRotation
      }
    }
  },
})
    return () => {

      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(rafId)
      cancelAnimationFrame(requestId)
      lenis.destroy()
      ScrollTrigger.getAll().forEach((t) => t.kill())

      if (model) scene.remove(model)
      renderer.dispose()
      modelContainer.innerHTML = ''
    }
  }, [])

  return (
    <div ref={rootRef}>
      <section className="intro">
        <h1>Capi coins</h1>
      </section>

      <section className="product-overview">
        <div className="header-1 text-black"><h1>Impulsa tu negocio</h1></div>
        {/* <div className="header-2"><h1>GRND shaker</h1></div> */}
        <div className="circular-mask"></div>

       <div className="tooltips">
  <div className="tooltip">
    <div className="divider"></div>
    <div className="title"><h2>Negocio</h2></div>
    <div className="description">
      <p>
        ¿Cansado de la publicidad digital? Distribuye tus premios
        en tu ubicación exacta. <span>Garantizamos que los usuarios cercanos usen la app, se dirijan a tu local para reclamar su Capy Coin y te conozcan.</span>
      </p>
    </div>
  </div>

  <div className="tooltip">
    <div className="divider"></div>
    <div className="title"><h2>Explorador</h2></div>
    <div className="description">
      <p>
        ¿Quieres ganar premios explorando? Abre el mapa y <span>encuentra Capy Coins y ofertas</span> que negocios de tu vecindario han colocado para ti. Acércate al punto para reclamar tu premio. <span>¡La recompensa está a pocos metros!</span>
      </p>
    </div>
  </div>
</div>

        <div className="model-container" ref={modelContainerRef} />
      </section>

      <section className="outro">
        <h1>Registrate ahora</h1>
      </section>
    </div>
  )
}
