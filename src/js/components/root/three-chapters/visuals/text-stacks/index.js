import * as THREE from 'three'
import { loadFont, OrbitControls } from '@three-util'
import fontJSONPath from '@assets/fonts/json/Passion_One_Regular.typeface.json'
import { TextColumns, CircleWaveCentral, VerticalLines } from './text-stacks_classes.js'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Object3D, Vector3, Mesh, Group, Color,
  AmbientLight, DirectionalLight,
  PlaneGeometry, MeshLambertMaterial,
  GridHelper
} = THREE
const renderScene = () => renderer.render(scene, camera)
const [fieldWidth, fieldHeight] = [150, 150]
const cameraSettings = {
  fov: 75, near: 0.1, far: 2000, // define camera frustum
  position: new Vector3(fieldWidth * 0.65, fieldWidth * 1.05, fieldHeight * 1.1),
  lookAt: [fieldWidth/2, 0.1, fieldHeight/3]
}
const colors = {
  bg: '#F2B90C',
  text: '#021F59',
  plane: '#081A40',
  ambientLight: '#FFFFFF',
  directionalLight: '#FFFFFF',
  grid: '#FFFFFF'
}
const textColumnSettings = {
  texts: ['GIMME', 'SOME', 'LOVE'],
  rowDiff: 10, columnDiff: 7, gap: 4,
  fontSize: 16
}
const PLANE_SIZE = 700

// variables to be shared around
let renderer, scene, camera, orbitControl, plane, grid
let ambientLight, directionalLight
let textBuilding, textRowArr = [], circleWaveCentral, verticalLines
let animationid = null

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true })

  renderer.setClearColor(colors.bg, 1)
  renderer.shadowMap.enabled = true

  scene = new Scene()

  // define camera & orbitControl
  {
    const { fov, near, far, position, lookAt } = cameraSettings

    camera = new PerspectiveCamera(fov, 1, near, far)
    camera.position.copy(position)
    camera.lookAt(...lookAt)

    // control
    orbitControl = new OrbitControls(camera, canvasEl)
    orbitControl.screenSpacePanning = true
    orbitControl.update()
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

  // plane
  {
    plane = new Mesh(
      new PlaneGeometry(PLANE_SIZE, PLANE_SIZE),
      new MeshLambertMaterial({ color: colors.plane,
        side: THREE.DoubleSide, transparent: true, opacity: 1
      })
    )
    plane.rotation.x = Math.PI * -0.5
    plane.rotation.z = Math.PI * 0.5
    plane.receiveShadow = true

    grid = new GridHelper(PLANE_SIZE, 8, new Color(colors.grid))
    grid.position.y = 0.1

    scene.add(grid)
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
          columnHeightDiff: columnDiff, gap,
          outlined: index % 2 === 0 ? 'even' : 'odd',
          updateDelay: 300 * index
        })

        textRow.position.z = firstRowZEdge + (fontPlaneSide + gap) * index
        
        textRowArr.push(textRow)
        textBuilding.add(textRow)
      })

      textBuilding.position.x = -1 * fontPlaneSide * 2.2
      scene.add(textBuilding)

      circleWaveCentral = new CircleWaveCentral({
        scene, initRadius: 40, radiusMax: 320,
        dotAmount: 24, interval: 3000
      })
    })

    verticalLines = new VerticalLines({ 
      lineSize: 800, 
      planeSide: PLANE_SIZE})

    scene.add(verticalLines)
  }

  renderScene()
  animate()
}

function animate () {
  animationid = window.requestAnimationFrame(animate)

  textRowArr.forEach(textRow => textRow.update())

  if(circleWaveCentral)
    circleWaveCentral.update()

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

  if (orbitControl)
    orbitControl.update()
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