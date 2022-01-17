import * as THREE from 'three'
import { Axes, CombineWithEdge, 
  geoGeometryBoundingBox, OrbitControls
} from '@three-util'
import { degreeToRadian, randomBetween, randomSign, 
  randomFromArray, signOf } from '@view-util'
import { color } from 'dat.gui'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector2, Vector3, Mesh, Group, Points, Line,
  BoxGeometry, SphereGeometry, BufferGeometry, Float32BufferAttribute,
  MeshBasicMaterial, MeshLambertMaterial, PointsMaterial, LineBasicMaterial,
  CatmullRomCurve3,
  AmbientLight
} = THREE
const dotNumber = 100

let renderer, scene, camera, axes, orbitControl, pointContainer, points2, spiralCurve
let ambientLight
let animationId

const renderScene = () => renderer.render(scene, camera)
const [fieldWidth, fieldHeight] = [400, 300]
const cameraSettings = {
  position: new Vector3(0, 0, 250),
  lookAt: [0,0,0]
  // position: new Vector3(fieldWidth/2, 300, fieldHeight*1.25),
  // lookAt: [fieldWidth/3, 0.1, fieldHeight/3*2]
}
const colors = {
  objects: ['#F2059F', '#F2E205', '#F24405', '#418FBF', '#D9ADD2', '#AD24BF', '#F2C063'],
  bg: '#000000', sphere: '#FFFFFF', line: '#18FFFF',
  light: '#FFFFFF'
}
const spiralVertices = []

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
  {
    const geometry = new BufferGeometry()
    const material = new PointsMaterial({ size: 3, color: colors.objects[2],
      transparent: true, opacity: 1, blending: THREE.AdditiveBlending })
    const geometryVertices = []
    let radius = 0, angle = 0, radiusIncrement = 0.45, angleIncrement = degreeToRadian(45)

    geometryVertices.push(0,0,0) // first dot
    const spreadVector3 = v => [v.x, v.y, v.z]
    for (let i=1; i<dotNumber; i++) {
      radius += radiusIncrement
      angle += angleIncrement

      const dot = new Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0)

      spiralVertices.push(dot)
      geometryVertices.push(...spreadVector3(dot))

      // radiusIncrement *= 1.005
      // angleIncrement *= 0.994
      radiusIncrement *= 1.005
      angleIncrement *= 0.987
    }

    geometry.setAttribute('position', new Float32BufferAttribute(geometryVertices, 3))

    // catmuli-curve
    const curve = new CatmullRomCurve3(spiralVertices)
    const pointsGot = curve.getPoints(dotNumber * 3)
    const curveGeometry = new BufferGeometry().setFromPoints(pointsGot)

    pointContainer = new Points(geometry, material)
    points2 = new Points(curveGeometry, new PointsMaterial({ size: 2, color: colors.objects[1]  }))
    spiralCurve = new Line(curveGeometry, new LineBasicMaterial({ color: '#FFFFFF' }))

    // scene.add(pointContainer)
    // scene.add(points2)
    scene.add(spiralCurve)
  }


  // render
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