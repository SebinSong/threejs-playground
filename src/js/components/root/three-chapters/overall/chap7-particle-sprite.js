import * as THREE from 'three'
import { Axes, PlaneXY, CombineMaterial, 
  getGeometryBoundingBox, OrbitControls } from './utils.js'
import { degreeToRadian, randomBetween } from '@view-util'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector2, Vector3, Color, Object3D, Group,
  PlaneGeometry,
  Mesh, MeshLambertMaterial, MeshBasicMaterial,
  AmbientLight, DirectionalLight,
  GridHelper, CameraHelper,

  Sprite,SpriteMaterial
} = THREE

let renderer, scene, camera, orbitControl
let ambientLight, directionalLight
let axes, customPlane, plane
let spriteGroup

let spriteRotateAngle = 0
let animationId = null

const renderScene = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [60, 60]
const gui = { controller: null, panel: null }
const cameraSettings = { fov: 50, near: 0.1, far: 1000,
  position: new Vector3(planeWidth * 1.1, Math.max(planeWidth, planeHeight) * 1.5, planeHeight * 1.1),
  lookAt: [planeWidth/2, 0, planeHeight/2] }
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
  
  scene.add(axes)
  scene.add(customPlane)
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
  scene.add(directionalLight.target)

  // camera helper
  // scene.add(new CameraHelper(directionalLight.shadow.camera))

  // ------ objects ------ //
  spriteGroup = new Group();

  (function () {
    const [spriteRow, spriteColumn, gap] = [6, 6, 3]
    const material = new SpriteMaterial() // defaults to 0xFFFFFF

    for (let r=0; r<spriteRow; r++) {
      for (let c=0; c<spriteColumn; c++) {
        const sprite = new Sprite(material)

        sprite.position.set(r*gap, c*gap, 0)
        spriteGroup.add(sprite)
      }
    }

    spriteGroup.rotation.x = Math.PI * -0.5
    spriteGroup.position.set(
      planeWidth/2 - gap * spriteRow / 2,
      0,
      planeHeight/2 + gap * spriteColumn / 2
    )
    scene.add(spriteGroup)
  })()

  // render & animate
  renderScene()
  animate()
}

function animate () {
  animationId = window.requestAnimationFrame(animate)

  const rotateAxis = new Vector3(0,0,1).normalize()

  spriteGroup.rotateOnAxis(rotateAxis, degreeToRadian(0.8))

  renderScene()
}

function setupOrbitControl () {
  if (!renderer.domElement)
    return

  orbitControl = new OrbitControls(camera, renderer.domElement)
  orbitControl.screenSpacePanning = true
  orbitControl.update()
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