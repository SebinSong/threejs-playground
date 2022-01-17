import * as THREE from 'three'
import { Axes, CombineWithEdge, 
  geoGeometryBoundingBox, OrbitControls
} from '@three-util'
import { degreeToRadian, randomBetween, randomSign, 
  randomFromArray, signOf } from '@view-util'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector2, Vector3, Mesh, Group,
  BoxGeometry, SphereGeometry,
  MeshBasicMaterial, MeshLambertMaterial,
  AmbientLight
} = THREE
const [cubeAmount] = [100]

let renderer, scene, camera, axes, orbitControl
let ambientLight
let cubes = []
let animationId

const renderScene = () => renderer.render(scene, camera)
const [fieldWidth, fieldHeight] = [400, 300]
const cameraSettings = {
  position: new Vector3(-fieldWidth/2, 150, fieldHeight/2),
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
  constructor ({ side = 3, color = colors.objects[1], 
    initPosition = new Vector3(0,0,0),
    refPoint = new Vector3(0,0,0)
  }) {
    super()

    const geometry = new BoxGeometry(side, side, side)
    const material = new MeshLambertMaterial({ color, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
    const mesh = new CombineWithEdge({
      geometry, material, edgeColor: colors.objects[4]
    })

    this.add(mesh)
    this.mesh = mesh
    this.material = material
    this.geometry = geometry

    this.position.copy(initPosition)
    this.refPoint = refPoint

    this.velAccel = new Vector3(0,0,0)
    this.velocity = new Vector3(0,0,0)

    this.update()
  }

  update () {
    const subVector = this.refPoint.sub(this.position)
    const [dirVector, length] = [subVector.clone(), subVector.length()]

    this.velAccel = new Vector3()
      .copy(dirVector)
      .normalize()
      .multiplyScalar(length / 5)

    this.velocity.add(this.velAccel)
    this.velocity.clampLength(0, 2)
    this.position.add(this.velocity)
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
  const maxLength = 80
  for (let n = 0; n < cubeAmount; n++) {
    const cube = cube = new Cube({ 
      side: 3, color: randomFromArray(colors.objects),
      initPosition: new Vector3(
        randomSign() * randomBetween(10, maxLength),
        randomSign() * randomBetween(10, maxLength),
        randomSign() * randomBetween(10, maxLength)
      ) 
    })

    scene.add(cube)
    cubes.push(cube)
  }

  renderScene()
  animate()
}

function animate () {
  animationId = window.requestAnimationFrame(animate)

  cubes.forEach(cube => cube.update())
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