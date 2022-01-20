import THREE from '@third-parties/three-old.js'
import { MeshLine, MeshLineMaterial } from 'meshline'
import { Axes, CombineWithEdge, 
  getGeometryBoundingBox, loadFont
} from '@three-util/utils-old.js'
import { degreeToRadian, randomBetween, randomSign, 
  randomFromArray, signOf } from '@view-util'
import fontJSONPath from '@assets/fonts/json/Passion_One_Regular.typeface.json'
import { CharColumn, TextColumns } from './text-stacks_classes.js'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Object3D, Vector3, Mesh, Color, Group,
  AmbientLight, DirectionalLight,
  PlaneGeometry, SphereGeometry, TextGeometry,
  MeshLambertMaterial, MeshPhongMaterial, ShadowMaterial
} = THREE
const renderScene = () => renderer.render(scene, camera)
const [fieldWidth, fieldHeight] = [150, 150]
const cameraSettings = {
  fov: 75, near: 0.1, far: 1000, // define camera frustum
  // position: new Vector3(fieldWidth * 0.65, fieldWidth * 1.05, fieldHeight * 1.1),
  // lookAt: [fieldWidth/2, 0.1, fieldHeight/3]
  position: new Vector3(fieldWidth * 0.7, fieldWidth * 1.05, fieldHeight * 0.85),
  lookAt: [fieldWidth/2, 0.1, fieldHeight/3]
}
const colors = {
  bg: '#38D0F2',
  text: '#021F59',
  ambientLight: '#FFFFFF',
  directionalLight: '#FFFFFF'
}
const textColumnSettings = {
  texts: ['CREAT', 'IVITY', 'LAB'],
  rowDiff: 10, columnDiff: 7, gap: 4,
  fontSize: 16
}

// variables to be shared around
let renderer, scene, camera, axes, plane
let ambientLight, directionalLight
let textBuilding
let animationid = null

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true })

  renderer.setClearColor(colors.bg, 1)
  renderer.shadowMap.enabled = true

  scene = new Scene()

  // define camera
  {
    const { fov, near, far, position, lookAt } = cameraSettings

    camera = new PerspectiveCamera(fov, 1, near, far)
    camera.position.copy(position)
    camera.lookAt(...lookAt)
  }

  // configure renderer & camera based on screen dimensions
  configureRendererAndCamera()
  setupEventListeners()

  // define lights
  {
    ambientLight = new AmbientLight(colors.ambientLight)
    directionalLight = new DirectionalLight(colors.directionalLight, 1)
    directionalLight.target = new Object3D()

    directionalLight.position.set(-1 * fieldWidth/2, 100, -1 * fieldHeight/2)
    directionalLight.target.position.set(fieldWidth/2, 0.1, fieldHeight/2)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.set(4096, 4096); // prevent shadows from getting blurred

    const shadowCamera = directionalLight.shadow.camera

    shadowCamera.left = -100
    shadowCamera.right = 100
    shadowCamera.top = 100
    shadowCamera.bottom = -100

    scene.add(ambientLight, directionalLight, directionalLight.target)
  }

  // axes &
  {
    axes = new Axes({ color: colors.text, size: fieldWidth * 1.5 })
    scene.add(axes)

    plane = new Mesh(
      new PlaneGeometry(fieldWidth, fieldHeight),
      new ShadowMaterial({ opacity: 0.3 })
      // new MeshLambertMaterial({ color: colors.bg, side: THREE.DoubleSide, 
      //   transparent: true, opacity: 1 })
    )
    plane.rotation.x = Math.PI * -0.5
    plane.position.set(fieldWidth/2, 0, fieldHeight/2)
    plane.receiveShadow = true

    scene.add(plane)
  }

  // objects
  {
    loadFont(fontJSONPath).then(function (font) {
      if (!font) return

      textBuilding = new Group()

      const { texts, rowDiff, columnDiff, fontSize, gap } = textColumnSettings
      const fontPlaneSide = fontSize * 1.3
      const firstRowZEdge = 0.5 * fontPlaneSide * (1 - texts.length)

      texts.forEach((text, index) => {
        const textRow = new TextColumns({
          text, font, fontSize,
          firstColumnHeight: 60 + -1 * index * rowDiff,
          columnHeightDiff: columnDiff, gap
        })

        textRow.position.z = firstRowZEdge + (fontPlaneSide + gap) * index
        textBuilding.add(textRow)
      })

      textBuilding.position.set(
        fontPlaneSide * 3, 0, fontPlaneSide * 4)
      scene.add(textBuilding)
    })
  }

  renderScene()
  animate()
}

function animate () {
  animationid = window.requestAnimationFrame(animate)

  renderScene()
}

function configureRendererAndCamera () {
  const pixelRatio = window.devicePixelRatio || 1
  const { width, height, clientWidth, clientHeight } = renderer.domElement
  const [desiredWidth, desiredHeight] = [clientWidth * pixelRatio, clientHeight * pixelRatio]
  const aspectRatio = clientWidth / clientHeight

  if (width !== desiredWidth || height !== desiredHeight)
    renderer.setSize(desiredWidth, desiredHeight, false)

  if (camera.aspect !== aspectRatio) {
    camera.aspect = aspectRatio
    camera.updateProjectionMatrix()
  }
}

function setupEventListeners () {
  window.addEventListener('resize', onScreenResize)
}

function onScreenResize () {
  configureRendererAndCamera()
  renderScene()
}

export {
  initThree
}