import * as THREE from 'three'
import { Axes, CombineMaterial, 
  geoGeometryBoundingBox, OrbitControls
} from './utils.js'
import { degreeToRadian, randomBetween } from '@view-util'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector3,
  TorusBufferGeometry, BufferGeometry, BufferAttribute,
  Mesh, MeshBasicMaterial,
  Points, PointsMaterial,
  CanvasTexture, Clock,
  AmbientLight
} = THREE

let renderer, scene, camera, orbitControl
let ambientLight, directionalLight
let axes, object, particlesMesh, clock
let animationId = null

const renderScene = () => renderer.render(scene, camera)
const cameraSettings = {
  fov: 75, near: 0.1, far: 1000,
  position: new Vector3(0, 0, 35),
  lookAt: [0, 0, 0]
}
const mouse = { x: 0, y: 0 }
const colors = {
  bg: '#000000',
  dot: '#18FFFF',
  line: '#FFFFFF',
  light: '#FFFFFF'
}

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({
    canvas: canvasEl, alpha: true, antialias: true
  })
  renderer.setPixelRatio(window.devicePixelRatio || 1)
  renderer.setClearColor(colors.bg, 1)
  scene = new Scene()

  // camera
  {
    const { fov, near, far,
      position, lookAt } = cameraSettings

    camera = new PerspectiveCamera(fov, 1, near, far)
    camera.position.copy(position)
    camera.lookAt(...lookAt)
  }

  // clock
  clock = new Clock()

  configureRendererAndCamera()
  setupEventListeners()

  // light
  ambientLight = new AmbientLight(colors.light)
  scene.add(ambientLight)

  // axes
  axes = new Axes({ color: colors.line, size: 200 })

  scene.add(axes)

  // objects
  {
    const [objRadius,
      tubeRadius,
      tubeSegments,
      radialSegments] = [12, 4, 46, 12]

    const geometry = new TorusBufferGeometry(
      objRadius,tubeRadius, radialSegments, tubeSegments)
    const pointMaterial = new PointsMaterial({ 
      color: colors.dot, transparent: true, 
      opacity: 0.7, size: 1.5, sizeAttenuation: false
    })

    object = new Points(geometry, pointMaterial)
    scene.add(object)

    // particles geo
    const particlesGeomtry = new BufferGeometry()
    const particlesCnt = 150
    const posArray = new Float32Array(particlesCnt * 3)

    for (let i=0; i < particlesCnt * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 700
    }

    particlesGeomtry.setAttribute('position', new BufferAttribute(posArray, 3))
    particlesMesh = new Points(
      particlesGeomtry,
      new PointsMaterial({ 
        map: drawStarTexture(), transparent: true, size: 3
      })
    )

    scene.add(particlesMesh)
  }

  renderScene()
  animate()
}

function drawStarTexture () {
  const el = document.createElement('canvas')
  const ctx = el.getContext('2d')

  // define size
  el.width = 10
  el.height = 10

  ctx.strokeStyle = '#FFFFFF'

  ctx.beginPath()
  ctx.moveTo(5, 1)
  ctx.lineTo(5, 9)
  ctx.moveTo(1, 5)
  ctx.lineTo(9, 5)
  ctx.moveTo(3, 3)
  ctx.lineTo(7, 7)
  ctx.moveTo(3, 7)
  ctx.lineTo(7, 3)

  ctx.stroke()

  const texture = new CanvasTexture(el)
  texture.needsUpdate = true

  return texture
}

function animate () {
  animationId = requestAnimationFrame(animate)

  const elapsedTime = clock.getElapsedTime()
  object.rotation.y += 0.005

  particlesMesh.rotation.z = elapsedTime * 0.3;
  particlesMesh.rotation.x = elapsedTime * 0.4;

  renderScene()
}

function configureRendererAndCamera () {
  const { width, height, clientWidth, clientHeight } = renderer.domElement
  const aspectRatio = clientWidth / clientHeight

  if (width !== clientWidth || height !== clientHeight) {
    renderer.setSize(clientWidth, clientHeight, false)

    mouse.x = clientWidth / 2
    mouse.y = clientHeight / 2
  }

  if (camera.aspect !== aspectRatio) {
    camera.aspect = aspectRatio

    camera.updateProjectionMatrix()
  }

  if (orbitControl)
    orbitControl.update()
}

function onScreenResize () {
  configureRendererAndCamera()
  renderScene()
}

function setupEventListeners () {
  window.addEventListener('resize', onScreenResize)

  renderer.domElement.addEventListener('mousemove', e => {
    mouse.x = e.clientX
    mouse.y = e.clientY
  })
}

export { initThree }