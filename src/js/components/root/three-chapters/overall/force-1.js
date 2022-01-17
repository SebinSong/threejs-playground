import * as THREE from 'three'
import { Axes, CombineMaterial, 
  geoGeometryBoundingBox, OrbitControls
} from './utils.js'
import { degreeToRadian, randomBetween, randomSign, randomFromArray } from '@view-util'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector2, Vector3, Mesh, Group,
  BoxGeometry,
  MeshBasicMaterial, MeshLambertMaterial,
  AmbientLight
} = THREE

let renderer, scene, camera, axes, orbitControl
let ambientLight
let obj
let animationId

const renderScene = () => renderer.render(scene, camera)
const [fieldWidth, fieldHeight] = [400, 300]
const cameraSettings = {
  position: new Vector3(fieldWidth/3, 500, fieldHeight*1.5),
  lookAt: [0,0,0]
  // position: new Vector3(fieldWidth/2, 300, fieldHeight*1.25),
  // lookAt: [fieldWidth/3, 0.1, fieldHeight/3*2]
}
const colors = {
  objects: ['#F2059F', '#F2E205', '#F24405', '#418FBF', '#D9ADD2', '#AD24BF', '#F2C063'],
  bg: '#000000', sphere: '#FFFFFF', line: '#18FFFF',
  light: '#FFFFFF'
}

class Cube extends Group {
  constructor ({
    initPosition = new Vector3(0,0,0),
    sideLength = 8,
    color = "#FFFFFF" }) {
    super()

    const geometry = new BoxGeometry(sideLength, sideLength, sideLength)
    const materials = [
      new MeshLambertMaterial({ 
        color, transparent: true, opacity: 0.75, side: THREE.DoubleSide }),
      new MeshLambertMaterial({ 
        color: '#8A8A8A', transparent: true, opacity: 0.35, 
        side: THREE.DoubleSide, wireframe: true })
    ]

    const innerGroup = new Group()
    const obj = new CombineMaterial(geometry, materials)
    obj.position.copy(initPosition)

    this.geometry = geometry
    this.material = materials[0]
    this.object = obj
    this.innerGroup = innerGroup
    this.rotationStatus = { axis: null, degree: 0 }

    innerGroup.add(obj)
    this.add(innerGroup)
  }

  rotate (axis, degree) {
    if (!axis)
      return

    const { axis: prevAxis, degree: prevDegree } = this.rotationStatus

    if (prevAxis) // rotateOnAxis is an accumulative operation, so the previous rotation needs to be reverted first
      this.object.rotateOnAxis(prevAxis, 
        -1 * degreeToRadian(prevDegree))

    this.object.rotateOnAxis(axis, degreeToRadian(degree))

    this.rotationStatus.axis = axis
    this.rotationStatus.degree = degree
  }

  update () {

  }
}

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({
    canvas: canvasEl, alpha: true, antialias: true
  })

  renderer.setPixelRatio(window.devicePixelRatio || 1)
  renderer.setClearColor(colors.bg, 1)
  renderer.shadowMap.enabled = true

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

  // axes
  axes = new Axes({ color: colors.line, size: fieldWidth })
  scene.add(axes)

  // objects
  obj = new Cube({
    color: colors.objects[3],
    sideLength: 30,
    initPosition: new Vector3(50, 50, 50)
  })

  scene.add(obj)

  renderScene()
  animate()
}

function animate () {
  animationId = window.requestAnimationFrame(animate)

  renderScene()
}

function configureRendererAndCamera () {
  const { width, height, clientWidth, clientHeight } = renderer.domElement
  const aspectRatio = clientWidth / clientHeight

  if (width !== clientWidth || height !== clientHeight)
    renderer.setSize(clientWidth, clientHeight, false)

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
}

export { initThree }