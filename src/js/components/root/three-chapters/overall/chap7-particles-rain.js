import * as THREE from 'three'
import { Axes, PlaneXY, CombineMaterial, 
  getGeometryBoundingBox, OrbitControls } from './utils.js'
import { degreeToRadian, randomBetween } from '@view-util'
import textureImagePath from '@images/textures/sprite-sheet.png'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector2, Vector3, Color, Object3D, Group, Box3, Sprite,
  PlaneGeometry,
  Mesh, MeshLambertMaterial, MeshBasicMaterial, SpriteMaterial,
  AmbientLight, DirectionalLight,
  GridHelper, CameraHelper, Box3Helper,
  TextureLoader,

  Points, PointsMaterial, CanvasTexture,
  FogExp2
} = THREE

let renderer, scene, camera, orbitControl
let ambientLight, directionalLight
let axes, customPlane, plane

let animationId = null

const renderScene = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [100, 100]
const gui = { controller: null, panel: null }
const cameraSettings = { fov: 50, near: 0.1, far: 1000,
  position: new Vector3(50, 70, 50),// new Vector3(planeWidth*2, Math.max(planeWidth, planeHeight)*2.5, planeHeight*2),
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
const rainDrops = new Group()

const rainyAreaInfo = {
  width: 50, // x
  height: 60, // z
  depth: 80 // y
}
class RainDrop extends Sprite {
  constructor (material) {
    super(material)
    const randomFloat = v => Math.random() * v
    const { width, height, depth } = rainyAreaInfo

    this.position.set(
      randomFloat(width),
      depth - randomFloat(20),
      randomFloat(height)
    )
    this.vy = (0.3 + randomFloat(0.3)) * -1
  }

  addTo (group) { group.add(this); }

  update () {
    this.position.y += this.vy

    if (this.position.y < 0)
      this.position.y = rainyAreaInfo.depth
  }
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
  const textureLoader = new TextureLoader()
  const onTextureLoad = texture => {
    texture.name = 'rain-drop'
    texture.needsUpdate = true

    const rainDropNum = 100

    for (let i=0; i<rainDropNum; i++) {
      const textureClone = texture.clone()
      textureClone.needsUpdate = true

      const material = new SpriteMaterial({ 
        map: textureClone, size: 1
      })
      material.map.offset = new Vector2(0.2 * (i % 4), 0)
      material.map.repeat = new Vector2(0.2, 1)

      const sprite = new RainDrop(material)

      sprite.addTo(rainDrops)
    }
    scene.add(rainDrops)
  }

  textureLoader.load(
    textureImagePath, onTextureLoad
  )

  // add fog to the scene
  // scene.fog = new FogExp2('#FF0000', 0.0085)

  // render & animate
  renderScene()
  animate()
}

function animate () {
  animationId = window.requestAnimationFrame(animate)

  if (rainDrops.children.length > 0)
    rainDrops.children.forEach(sprite => sprite.update())

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