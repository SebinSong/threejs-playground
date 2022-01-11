import * as THREE from 'three'
import { Axes, PlaneXY, CombineMaterial, 
  getGeometryBoundingBox, OrbitControls } from './utils.js'
import { degreeToRadian, randomBetween } from '@view-util'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector2, Vector3, Color, Object3D, Group, Box3,
  BufferGeometry, Float32BufferAttribute, BufferAttribute,
  PlaneGeometry,
  Mesh, MeshLambertMaterial, MeshBasicMaterial,
  AmbientLight, DirectionalLight,
  GridHelper, CameraHelper, Box3Helper,

  Points, PointsMaterial, CanvasTexture,
  FogExp2
} = THREE

let renderer, scene, camera, orbitControl
let ambientLight, directionalLight
let axes, customPlane, plane
let points, canvasTexture

let animationId = null

const renderScene = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [100, 100]
const gui = { controller: null, panel: null }
const cameraSettings = { fov: 50, near: 0.1, far: 1000,
  position: new Vector3(50, 0, 50),// new Vector3(planeWidth*2, Math.max(planeWidth, planeHeight)*2.5, planeHeight*2),
  lookAt: [0,0,0]// [planeWidth/2, 0, planeHeight/2]
}
const colors = {
  objects: ['#F2059F', '#F2E205', '#F24405', '#418FBF', '#D9ADD2', '#AD24BF', '#F2C063'],
  line: '#6A6A6A',
  plane: '#F2EA77',
  light: '#FFFFFF',
  ambientLight: '#888888',
  directionalLight: '#FFFFFF'
}

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({ canvas: canvasEl, antialias: true })
  scene = new Scene()

  renderer.setClearColor(new Color('#000000'))
  renderer.shadowMap.enabled = true;

  (function () {
    // setup perspective camera
    const { fov, near, far, position, lookAt } = cameraSettings

    camera = new PerspectiveCamera(fov, 1, near, far)
    camera.position.copy(position)
    camera.lookAt(...lookAt)
  })()

  // orbit control
  // setupOrbitControl()

  configureRendererAndCamera()
  setupEventListeners()

  // axes & planes
  axes = new Axes({
    color: colors.line, size: Math.max(planeWidth, planeHeight) * 1.2
  })

  customPlane = new GridHelper(planeWidth, planeWidth)
  customPlane.translateX(planeWidth/2)
  customPlane.translateZ(planeWidth/2)

  plane = new Mesh(
    new PlaneGeometry(planeWidth, planeWidth, 1, 1),
    new MeshLambertMaterial({ color: colors.plane, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
  )
  plane.rotation.x = Math.PI * -0.5
  plane.position.set(planeWidth/2, 0, planeWidth/2)
  plane.receiveShadow = true
  
  // scene.add(axes)
  // scene.add(customPlane)
  // scene.add(plane)

  // lights
  ambientLight = new AmbientLight(colors.ambientLight)
  directionalLight = new DirectionalLight(colors.directionalLight, 1)
  directionalLight.target = new Object3D()

  directionalLight.position.set(-1 * planeWidth/2, 100, -1 * planeHeight/2)
  directionalLight.target.position.set(planeWidth/2, 0.1, planeHeight/2)
  directionalLight.castShadow = true

  directionalLight.shadow.camera.left = -100
  directionalLight.shadow.camera.right = 100
  directionalLight.shadow.camera.top = 100
  directionalLight.shadow.camera.bottom = -100

  scene.add(ambientLight)
  scene.add(directionalLight)
  scene.add(directionalLight.target);

  // camera helper
  // scene.add(new CameraHelper(directionalLight.shadow.camera))

  // ------ objects ------ //
  initTextureCanvas();

  (function () {
    const randomFloat = max => Math.random() * max
    const pointNum = 500
    const verticesArr = []
    const colorsArr = []

    const geometry = new BufferGeometry()
    const material = new PointsMaterial({ 
      size: 3, 
      map: canvasTexture,
      // vertexColors: true, 
      transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending,
      opacity: 0.8
      // sizeAttenuation: false
    })
    const maxDistance = 120

    for (let i=0; i<pointNum; i++) {
      const [x, y, z] = [
        randomFloat(maxDistance), randomFloat(maxDistance), randomFloat(maxDistance)
      ]
      const [r, g, b] = [
        x / maxDistance, y / maxDistance, z / maxDistance,
      ]

      verticesArr.push(x, y, z)
      colorsArr.push(r,g,b)
    }

    geometry.setAttribute('position', 
      new BufferAttribute(new Float32Array(verticesArr), 3))
    // NOTE: same as new new Float32BufferAttribute(verticesArr)
    geometry.setAttribute('color', 
      new BufferAttribute(new Float32Array(colorsArr), 3))
    // NOTE: same as new new Float32BufferAttribute(colorsArr)

    points = new Points(geometry, material)
    scene.add(points)

    points.geometry.center() // TODO: Let's find out more about what this exactly does.

    // box3 helper
    const box = new Box3(
      new Vector3(0,0,0),
      new Vector3(maxDistance, maxDistance, maxDistance))

    const boxHelper = new Box3Helper(box, 0xFFFFFF)

    // scene.add(boxHelper)
  })()

  // add fog to the scene
  scene.fog = new FogExp2('#FF0000', 0.0085)

  // render & animate
  renderScene()
  animate()
}

function animate () {
  animationId = window.requestAnimationFrame(animate)

  points.rotation.x += degreeToRadian(0.5)
  points.rotation.z += degreeToRadian(0.7)

  renderScene()
}

function setupOrbitControl () {
  if (!renderer.domElement)
    return

  orbitControl = new OrbitControls(camera, renderer.domElement)
  orbitControl.screenSpacePanning = true
  orbitControl.update()
}

function initTextureCanvas (el = null) {
  if (!el)
    el = document.createElement('canvas')

  const pixelRatio = window.devicePixelRatio || 1;
  const { width, height } = el
  const [dW, dH] = [pixelRatio * 100, pixelRatio * 100] // desired width & desired height

  if (width !== dW || height !== dH) {
    el.width = dW
    el.height = dH
  }

  const ctx = el.getContext('2d')
  ctx.clearRect(0, 0, dW, dH)
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'

  // draw box
  ctx.fillRect(5, 5, 90, 90)
  ctx.clearRect(10, 10, 80, 80)

  // draw triangles
  ctx.beginPath()
  ctx.moveTo(14, 14)
  ctx.lineTo(30, 14)
  ctx.lineTo(14, 30)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(86, 14)
  ctx.lineTo(70, 14)
  ctx.lineTo(86, 30)
  ctx.closePath()
  ctx.stroke()

  // draw arc
  ctx.beginPath()
  ctx.arc(50, 50, 30, 0, Math.PI*2, true)
  ctx.moveTo(40 + 5, 40)
  ctx.arc(40, 40, 5, 0, Math.PI*2, false)
  ctx.moveTo(60 + 5, 40)
  ctx.arc(60, 40, 5, 0, Math.PI*2, false)

  ctx.ellipse(50, 60, 14, 6, 0, Math.PI*2, false)
  ctx.closePath()
  ctx.fill('evenodd')

  canvasTexture = new CanvasTexture(el)
  canvasTexture.needsUpdate = true
}

function configureRendererAndCamera () {
  const pixelRatio = window.devicePixelRatio || 1
  const { width, height, clientWidth, clientHeight } = renderer.domElement
  const [desiredWidth, desiredHeight] = [pixelRatio * clientWidth, pixelRatio * clientHeight]
  const aspectRatio = clientWidth / clientHeight

  if (width !== desiredWidth || height !== desiredHeight)
    renderer.setSize(desiredWidth, desiredHeight, false)

  if (camera.aspect !== aspectRatio) {
    camera.aspect = aspectRatio
    camera.updateProjectionMatrix()
  }

  if (orbitControl) // whenever any camera setting's been updated, update orbit control too
    orbitControl.update()
}

function onScreenResize () {
  configureRendererAndCamera()
  renderScene()
}

function setupEventListeners () {
  window.addEventListener('resize', onScreenResize)
}


export {
  initThree
}