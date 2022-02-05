import * as THREE from 'three'
import { Axes } from '@three-util'
import { degreeToRadian } from '@view-util'
import { Sphere, WaveEntity, Waves } from './sphere-particle-classes.js'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector2, Vector3, Object3D, Mesh, Group, Color,
  AmbientLight, SpotLight, Fog,
  SphereGeometry,
  MeshStandardMaterial
} = THREE

const colors = {
  bg: '#000000',
  object: '#DDDDDD',
  axes: '#FFFF00',
  ambientLight: '#FFFFFF',
  spotLight: '#FFFFFF',
  wave: '#FFFFFF'
}
const mouse = new Vector2(0,0)
const [SPHERE_RADIUS, PARTICLE_AMOUNT] = [15, 1000]
const cameraSettings = {
  fov: 45, near: 0.1, far: 1000,
  position: new Vector3(0, 0, SPHERE_RADIUS*4.5),
  lookAt: [0,0,0]
}
const throttle = new (function () {
  this.interval = 50
  this.prev = null

  this.reset = () => { this.prev = Date.now() }
})()

// varaiables to be shared around
let renderer, scene, camera
let axes, ambientLight, spotLight
let sphere, wave, waves
let animationId = null, mouseMoveTimeoutId = null
const renderScene = () => renderer.render(scene, camera)

function initThree (canvasEl) {
  // renderer & camera
  renderer = new WebGLRenderer({
    canvas: canvasEl, apha: true, antialias: true })

  renderer.setClearColor(new Color(colors.bg), 1)
  renderer.shadowMap.enabled = true

  scene = new Scene()

  const fogStart = cameraSettings.position.z - SPHERE_RADIUS * 0.5
  const fogEnd = fogStart + SPHERE_RADIUS * 2.25
  scene.fog = new Fog(colors.bg, fogStart, fogEnd)

  { // create camera
    const { fov, near, far, position, lookAt } = cameraSettings
    camera = new PerspectiveCamera(fov, 1, near, far)

    camera.position.copy(position)
    camera.lookAt(...lookAt)
  }

  configureRendererAndCamera()
  setupEventListeners()

  { // lights
    ambientLight = new AmbientLight(colors.ambientLight)
    
    spotLight = new SpotLight(colors.spotLight, 100, 100)
    spotLight.position.set(0, 0, -1 * SPHERE_RADIUS * 2)
    spotLight.target = new Object3D()
    spotLight.target.position.set(0,0,0)

    scene.add(ambientLight)
    scene.add(spotLight)
    scene.add(spotLight.target)
  }

  { // axes
    axes = new Axes({ color: colors.axes, size: 50 })

    // scene.add(axes)
  }

  // object
  initObject()

  renderScene()
  animate()
}

function animate () {
  animationId = window.requestAnimationFrame(animate)

  sphere.update(mouse)
  waves.update()
  renderScene()
}

function initObject () {
  const isTabletSize = window.innerWidth <= 1000
  const isInMobileSize = window.innerWidth <= 600

  const radiusToUse = isInMobileSize ? SPHERE_RADIUS * 0.75 : 
    isTabletSize ? SPHERE_RADIUS * 0.85 : 
    SPHERE_RADIUS
  const particleAmount = isInMobileSize ? Math.ceil(PARTICLE_AMOUNT * 0.5) :
    isTabletSize ? Math.ceil(PARTICLE_AMOUNT * 0.7) : PARTICLE_AMOUNT

  sphere && sphere.remove()
  waves && waves.remove()

  sphere = new Sphere({
    color: colors.object,
    particleRadius: radiusToUse / 180,
    particleAmount: particleAmount,
    sphereRadius: radiusToUse,
    spherePosition: new Vector3(0,0,0),
    rotationSpeed: degreeToRadian(0.25)
  })

  waves = new Waves({
    waveAmount: 5, dotAmount: 8, length: radiusToUse * 2 * 0.9
  })

  scene.add(waves, sphere)
}

function configureRendererAndCamera () {
  const pixelRatio = window.devicePixelRatio || 1
  const { width, height, clientWidth, clientHeight } = renderer.domElement
  const [desiredWidth, desiredHeight] = [
    pixelRatio * clientWidth, pixelRatio * clientHeight
  ]
  const aspectRatio = clientWidth / clientHeight

  if (width !== desiredWidth || height !== desiredHeight)
    renderer.setSize(desiredWidth, desiredHeight, false)
  if (camera.aspect !== aspectRatio) {
    camera.aspect = aspectRatio
    camera.updateProjectionMatrix()
  }
}

function onWindowResize () {
  configureRendererAndCamera()

  initObject()
  renderScene()
}

function setupEventListeners () {
  const lerpFactory = ([i1, i2], [o1, o2]) => {
    const [dInput, dOutput] = [i2 - i1, o2 - o1]

    return inputVal => {
      if (inputVal <= i1) return o1
      else if (inputVal >= i2) return o2

      return o1 + dOutput * (inputVal - i1) / dInput
    }
  }

  const onPointerMove = (pointerType, e) => {
    const lerp = lerpFactory([400, 1200], [0.3, 1])
    const { clientX, clientY, movementX } = pointerType === 'touch' ? e.touches[0] : e

    if (throttle.prev === null || 
      (Date.now() - throttle.prev >= throttle.interval)) {
      throttle.reset()

      mouse.x = (clientX / window.innerWidth - 0.5) * lerp(window.innerWidth)
      mouse.xVel = movementX || 0
    }

    mouse.y = (clientY / window.innerHeight - 0.5)
  }

  window.addEventListener('resize', onWindowResize)

  if (window.matchMedia('(hover: hover)').matches)
    window.addEventListener('mousemove', onPointerMove.bind(this, 'mouse'))
  else
    window.addEventListener('touchmove', onPointerMove.bind(this, 'touch'))
}

export {
  initThree
}