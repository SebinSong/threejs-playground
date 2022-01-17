import * as THREE from 'three'
import { Axes, CombineMaterial, 
  geoGeometryBoundingBox, OrbitControls
} from '@three-util'
import { degreeToRadian, randomBetween, randomSign, 
  randomFromArray, signOf } from '@view-util'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector2, Vector3, Mesh, Group,
  BoxGeometry, CylinderGeometry, SphereGeometry,
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
  position: new Vector3(-fieldWidth/3, 500, fieldHeight/3),
  lookAt: [0,0,0]
  // position: new Vector3(fieldWidth/2, 300, fieldHeight*1.25),
  // lookAt: [fieldWidth/3, 0.1, fieldHeight/3*2]
}
const colors = {
  objects: ['#F2059F', '#F2E205', '#F24405', '#418FBF', '#D9ADD2', '#AD24BF', '#F2C063'],
  bg: '#000000', sphere: '#FFFFFF', line: '#18FFFF',
  light: '#FFFFFF'
}

class Bong extends Group {
  constructor (color = colors.objects[0]) {
    super()

    const cyl = { r: 5, h: 120 }
    const material = new MeshLambertMaterial({ color, transparent: true, 
      opacity: 0.8, side: THREE.DoubleSide})
    const createBong = () => {
      const cylinder = new Mesh(new CylinderGeometry(cyl.r, cyl.r, cyl.h), material)
      const sphere = new Mesh(new SphereGeometry(cyl.r * 1.5, 32, 32), material)
      const [sphereTop, sphereBottom] = [sphere.clone(), sphere.clone()]
      const bong = new Group()

      sphereTop.position.y = cyl.h / 2
      sphereBottom.position.y = -1 * cyl.h / 2

      bong.add(cylinder, sphereTop, sphereBottom)
      return bong
    }
    
    const [bong1, bong2] = [createBong(), createBong()]
    const innerGroup = new Group()

    bong2.rotation.z = Math.PI * 0.5
    innerGroup.add(bong1, bong2)
    this.innerGroup = innerGroup
    this.add(innerGroup)

    this.material = material

    this.angleSpeed = 0
    this.angleSpeedMax = degreeToRadian(10)
    this.angleAccel = degreeToRadian(0.045)

    this.bodyRotationSpeed = degreeToRadian(-0.5)
  }

  update () {
    this.angleSpeed += this.angleAccel

    if (Math.abs(this.angleSpeed) > this.angleSpeedMax)
      this.angleSpeed = signOf(this.angleSpeed) * this.angleSpeedMax

    this.innerGroup.rotation.z += this.angleSpeed
    this.rotation.x += this.bodyRotationSpeed
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
  obj = new Bong(colors.objects[3])

  scene.add(obj)

  renderScene()
  animate()
}

function animate () {
  animationId = window.requestAnimationFrame(animate)

  obj.update()
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