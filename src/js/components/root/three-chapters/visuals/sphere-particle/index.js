import * as THREE from 'three'
import { Axes } from '@three-util'
import { degreeToRadian } from '@view-util'
import { Sphere } from './sphere-particle-classes.js'

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
  spotLight: '#FFFFFF'
}
const mouse = new Vector2(0,0)
const [SPHERE_RADIUS, PARTICLE_AMOUNT] = [15, 1300]
const cameraSettings = {
  fov: 45, near: 0.1, far: 1000,
  position: new Vector3(0, 0, SPHERE_RADIUS*4.5),
  lookAt: [0,0,0]
}

// varaiables to be shared around
let renderer, scene, camera
let axes, ambientLight, spotLight
let sphere
let animationId = null
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

  { // object
    sphere = new Sphere({
      color: colors.object,
      particleRadius: SPHERE_RADIUS / 180,
      particleAmount: PARTICLE_AMOUNT,
      sphereRadius: SPHERE_RADIUS,
      spherePosition: new Vector3(0,0,0),
      rotationSpeed: degreeToRadian(0.25)
    })

    scene.add(sphere)
  }

  renderScene()
  animate()
}

function animate () {
  animationId = window.requestAnimationFrame(animate)

  sphere.update()
  renderScene()
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
  renderScene()
}

function setupEventListeners () {
  window.addEventListener('resize', onWindowResize)

  window.addEventListener('mousemove', e => {
    const { clientX, clientY } = e

    mouse.set(
      clientX / window.innerWidth - 0.5,
      clientY / window.innerHeight - 0.5
    )
  })
}

export {
  initThree
}