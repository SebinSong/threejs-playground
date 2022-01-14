import * as THREE from 'three'
import { Axes, CombineMaterial, 
  geoGeometryBoundingBox, OrbitControls, OutlineGeometry
} from './visuals_utils.js'
import { degreeToRadian, randomBetween } from '@view-util'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector3, Group,
  PlaneGeometry, EdgesGeometry, CircleGeometry,
  LineSegments, Mesh, LineBasicMaterial,
  AmbientLight
} = THREE

let renderer, scene, camera, orbitControl
let ambientLight, directionalLight
let axes, plane, boundaryBox
let animationId = null

const renderScene = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [100, 100]
const cameraSettings = {
  fov: 75, near: 0.1, far: 1000,
  position: new Vector3(0,0,100),
  lookAt: [0,0,0]
  // position: new Vector3(
  //   planeWidth, 
  //   Math.max(planeWidth, planeHeight) * 0.8, 
  //   planeHeight),
  // lookAt: [planeWidth/2, 0.1, planeHeight/2]
}
const mouse = { x: 0, y: 0 }
const colors = {
  bg: '#000000',
  obj: '#18FFFF',
  line: '#FFFFFF',
  light: '#FFFFFF'
}

class BoundaryBox extends Group {
  constructor ({ 
    width = 50, height = 50, depth = 50, color = colors.line,
    position = new Vector3(0, 0, 0)
  }) {
    super()

    const material = new LineBasicMaterial({ color, linewidth: 3, linecap: 'round' })
    const createGeometry = (w, h) => new EdgesGeometry(
      new PlaneGeometry(w, h)
    )

    const [front, back, left, right, bottom] = [
      new LineSegments(createGeometry(width, depth), material),
      new LineSegments(createGeometry(width, depth), material),
      new LineSegments(createGeometry(height, depth), material),
      new LineSegments(createGeometry(height, depth), material),
      new LineSegments(createGeometry(width, height), material)
    ]

    bottom.rotation.x = Math.PI * -0.5
    front.position.set(0, depth/2, height/2)
    back.position.set(0, depth/2, -1 * height/2)
    
    left.rotation.y = Math.PI * -0.5
    left.position.set(-0.5 * width, 0.5 * depth, 0)

    right.rotation.y = Math.PI * 0.5
    right.position.set(0.5 * width, 0.5 * depth, 0)

    this.position.copy(position)

    this.faces = { front, back, left, right, bottom }
    Object.values(this.faces).forEach(plane => {
      plane.computeLineDistances()
      this.add(plane)
    })
  }
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

  configureRendererAndCamera()
  setupEventListeners()

  // light
  ambientLight = new AmbientLight(colors.light)
  scene.add(ambientLight)

  // axes & planes
  axes = new Axes({ color: colors.line, size: 200 })

  scene.add(axes)

  // objects
  {
    boundaryBox = new BoundaryBox({ 
      width: 80, height: 80, depth: 60, 
      color: colors.obj, position: new Vector3(40, 0, 40) })

    scene.add(boundaryBox)

    // circle
    const circle = new OutlineGeometry(
      new CircleGeometry(8, 32), colors.obj
    )

    circle.lookAt(-1, 0, 0)

    scene.add(circle)
  }

  renderScene()
  animate()
}

function animate () {
  animationId = requestAnimationFrame(animate)

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