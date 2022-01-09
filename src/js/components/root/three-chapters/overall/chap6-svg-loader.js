import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CombineMaterial, getGeometryBoundingBox } from './utils.js'
import { degreeToRadian } from '@view-util'
import svgImagePath from '@images/tiger.svg'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  PlaneGeometry, ShapeGeometry,
  Mesh, MeshLambertMaterial, MeshBasicMaterial,
  AmbientLight, SpotLight,
  Vector3, Color, Object3D, Group,
  GridHelper
} = THREE

let renderer, scene, orbitControl, camera, gridHelper, loader, imgGroup
let ambientLight, spotLight
let animationId = null

const renderScene = () => renderer.render(scene, camera)
const [gridSideLength] = [160]
const gui = { controller: null, panel: null }
const cameraSettings = {
  fov: 50, near: 0.1, far: 1000,
  position: new Vector3(0, 0, 200),
  lookAt: [0, 0, 0]
}
const colors = {
  objects: ['#F2059F', '#F2E205', '#F24405', '#418FBF', '#D9ADD2', '#AD24BF', '#F2C063'],
  line: '#6A6A6A',
  plane: '#F2EA77',
  light: '#FFFFFF',
  ambientLight: '#888888'
}

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({ canvas: canvasEl, antialias: true })
  scene = new Scene()

  renderer.setClearColor(new Color('#FFFFFF'))
  renderer.shadowMap.enabled = true;

  (function () {
    const { fov, near, far, position, lookAt } = cameraSettings

    camera = new PerspectiveCamera(fov, 1, near, far)
    camera.position.copy(position)
    camera.lookAt(...lookAt)
  })()

  // orbit control
  orbitControl = new OrbitControls(camera, canvasEl)
  orbitControl.addEventListener('change', renderScene)
  orbitControl.screenSpacePanning = true

  configureRendererAndCamera()
  setupEventListeners()

  // axes & planes
  gridHelper = new GridHelper(160, 10)
  gridHelper.rotation.x = Math.PI * 0.5
  scene.add(gridHelper)

  // lights
  ambientLight = new AmbientLight(colors.ambientLight)
  spotLight = new SpotLight(colors.light, 1.25)
  spotLight.position.set(-40, -40, 80)
  spotLight.target = new Object3D()
  spotLight.target.position.set(0, 0, 0)
  spotLight.castShadow = true

  scene.add(ambientLight)
  scene.add(spotLight)
  scene.add(spotLight.target)

  // objects
  imgGroup = new Group()
  imgGroup.scale.multiplyScalar(0.25)
  imgGroup.position.x = -70
  imgGroup.position.y = 70
  imgGroup.scale.y *= -1

  loader = new SVGLoader()
  loader.load(svgImagePath, data => {
    const { paths } = data

    for (const path of paths) {
      const { subPaths, userData } = path
      const { fill, fillOpacity, 
        stroke, strokeOpacity } = userData.style

      // fill
      const fillMaterial = new MeshBasicMaterial({
        color: new Color().setStyle(fill), transparent: true, 
        opacity: fillOpacity, side: THREE.DoubleSide
      })
      const fillShapes = SVGLoader.createShapes(path)
      
      for (const shape of fillShapes) {
        const fillMesh = new Mesh(
          new ShapeGeometry(shape),
          fillMaterial
        )

        imgGroup.add(fillMesh)
      }

      if (!stroke)
        continue

      // stroke
      const strokeMaterial = new MeshBasicMaterial({
        color: new THREE.Color().setStyle(stroke), transparent: true, opacity: strokeOpacity,
        side: THREE.DoubleSide
      })

      for (const subPath of subPaths) {
        const strokeGeometry = SVGLoader.pointsToStroke(subPath.getPoints(), userData.style)

        if (strokeGeometry) {
          const strokeMesh = new Mesh(strokeGeometry, strokeMaterial)

          imgGroup.add(strokeMesh)
        }
      }
    }
  })

  scene.add(imgGroup)

  // render & animation
  renderScene()
  animate()
}

function animate () {
  animationId = window.requestAnimationFrame(animate)

  renderScene()
}


function setupEventListeners () {
  window.addEventListener('resize', onScreenResize)
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

function onScreenResize () {
  configureRendererAndCamera()
  renderScene()
}


export {
  initThree
}