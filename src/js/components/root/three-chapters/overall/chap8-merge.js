import * as THREE from 'three'
import { Axes, PlaneXY,
  getGeometryBoundingBox, CombineWithEdge,
  OrbitControls } from './utils.js'
import { degreeToRadian, randomSign } from '@view-util'
import { MeshStandardMaterial } from 'three'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector3, Color, Group, Mesh,
  BufferGeometry, PlaneGeometry, ConeGeometry,
  MeshLambertMaterial, MeshBasicMaterial,
  AmbientLight, DirectionalLight
} = THREE

let renderer, scene, camera, orbitControl
let ambientLight
let axes, plane, planeDash, cone
let animationId = null

const renderScene = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [80, 80]
const cameraSettings = {
  fov: 75, near: 0.1, far: 1000,
  position: new Vector3(
    planeWidth, 80, planeHeight
  ),
  lookAt: [planeWidth * 0.4, 0.1, planeHeight * 0.4]
}
const colors = {
  bg: '#FFFFFF',
  ambientLight: '#FFFFFF',
  line: '#6A6A6A',
  plane: '#3C5659',
  cone: '#F24405'
}
const CONE_AMOUNT = 50

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({
    canvas: canvasEl, antialia: true })
  scene = new Scene()

  renderer.setClearColor(new Color (colors.bg))
  renderer.shadowMap.enabled = true

  // camera
  {
    const { fov, near, far, position, lookAt } = cameraSettings

    camera = new PerspectiveCamera(fov, 1, near, far)
    camera.position.copy(position)
    camera.lookAt(...lookAt)
  }

  configureRendererAndCamera()
  setupEventListeners()

  // lights
  {
    ambientLight = new AmbientLight(colors.ambientLight)

    scene.add(ambientLight)
  }

  // axes & plane
  {
    axes = new Axes({
      color: colors.line,
      size: Math.max(planeWidth, planeHeight) * 1.2
    })

    planeDash = new PlaneXY({
      color: colors.line, 
      width: planeWidth,
      height: planeHeight,
    })
    planeDash.rotation.x = -0.5 * Math.PI
    planeDash.position.set(0, 0.1, planeHeight)

    plane = new Mesh(
      new PlaneGeometry(planeWidth, planeHeight),
      new MeshLambertMaterial({ color: colors.plane,
        side: THREE.DoubleSide, transparent: true, opacity: 1 })
    )
    plane.rotation.x = -0.5 * Math.PI
    plane.position.set(planeWidth/2, 0, planeHeight/2)
    plane.receiveShadow = true

    scene.add(axes, planeDash, plane)
  }

  // objects
  {
    const CONE_RADIUS = 6
    const CONE_GROUP_RADIUS = 40

    const [geometry, material] = [
      new ConeGeometry(CONE_RADIUS, CONE_RADIUS * 1.2, 4, 1),
      new MeshBasicMaterial({
        color: colors.cone, side: THREE.DoubleSide,
        transparent: true, opacity: 1
      })
    ]
    const coneGroup = new Group()
    const mergeGeometry = new BufferGeometry()
    const { height: coneHeight } = getGeometryBoundingBox(geometry) 

    for (let i=0; i<CONE_AMOUNT; i++) {
      const cone = new Mesh(geometry, material)
      cone.rotation.y = Math.PI * 0.25
      cone.position.y += coneHeight / 2

      cone.position.x = randomSign() * Math.random() * CONE_GROUP_RADIUS
      cone.position.z = randomSign() * Math.random() * CONE_GROUP_RADIUS
      cone.updateMatrix()

      mergeGeometry.merge(cone.geometry)
    }

    const mergeMesh = new Mesh(
      mergeGeometry,
      new MeshStandardMaterial({
        color: '#000000', transparent: true, opacity: 1,
        side: THREE.DoubleSide
      })
    )
    
    scene.add(mergeMesh)
    // cone.rotation.x = -0.5 * Math.PI
  }

  renderScene()
  animate()
}

// helper funcs

function animate () {
  animationId = window.requestAnimationFrame(animate)

  renderScene()
}

function configureRendererAndCamera () {
  const pixelRatio = window.devicePixelRatio || 1
  const { width, height, clientWidth, clientHeight } = renderer.domElement
  const [desiredWidth, desiredHeight] = [
    pixelRatio * clientWidth, pixelRatio * clientHeight]
  const aspectRatio = clientWidth / clientHeight

  if (width !== desiredWidth || height !== desiredHeight)
    renderer.setSize(desiredWidth, desiredHeight, false)

  if (camera.aspect !== aspectRatio) {
    camera.aspect = aspectRatio

    camera.updateProjectionMatrix()
  }

  if (orbitControl)
    orbitControl.update()
}

function onWindowResize () {
  configureRendererAndCamera()
  renderScene()
}

function setupEventListeners () {
  window.addEventListener('resize', onWindowResize)
}

function cleanupThree () {
  window.removeEventListener('resize', onWindowResize)
}

export {
  initThree,
  cleanupThree
}