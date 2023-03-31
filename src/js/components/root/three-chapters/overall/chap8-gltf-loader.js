import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import jsonPath from '@assets/jsons/little_mountains.json'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector3, Color, Object3D,
  AmbientLight, DirectionalLight
  
} = THREE

let renderer, scene, camera
let ambientLight, directionalLight
let animationId

const renderScene = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [80, 80]
const cameraSettings = {
  fov: 75, near: 0.1, far: 1000,
  position: new Vector3(
    planeWidth * 1.1, 80, planeHeight * 1.1
  ),
  lookAt: [planeWidth * 0.4, 0.1, planeHeight * 0.4]
}
const colors = {
  bg: '#FFFFFF',
  ambientLight: '#DDDDDD',
  light: '#FFFFFF',
}

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({
    canvas: canvasEl, antialia: true })
  scene = new Scene()

  renderer.setClearColor(new Color (colors.bg))
  renderer.shadowMap.enabled = true

  // camera
  {
    const { fov, near, far, position, lookAt } = cameraSettings

    camera = new PerspectiveCamera(fov, 1, near, far)
    camera.position.copy(position)
    camera.lookAt(...lookAt)
  }

  configureRendererAndCamera()
  setupEventListeners()

  // lights
  {
    ambientLight = new AmbientLight(colors.ambientLight)
    directionalLight = new DirectionalLight(colors.light, 1)

    directionalLight.position.set(-1 * planeWidth/2, 40, planeHeight/2)
    directionalLight.target = new Object3D()
    directionalLight.target.position.set(planeWidth/2, 0.1, planeHeight/2)
    directionalLight.castShadow = true

    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100

    scene.add(ambientLight)
    scene.add(directionalLight, directionalLight.target)
  }

  { // importer
    const loader = new GLTFLoader()

    console.log('jsonPath: ', jsonPath)
    loader.parse(JSON.stringify(jsonPath), null, 
      result => {
        scene.add(result.scene)
      },
      err => {
        console.log('parse err: ', err)
      }
    )
  }

  renderScene()
  animate()
}

// helper funcs

function animate () {
  animationId = window.requestAnimationFrame(animate)

  renderScene()
}

function configureRendererAndCamera () {
  const pixelRatio = window.devicePixelRatio || 1
  const { width, height, clientWidth, clientHeight } = renderer.domElement
  const [desiredWidth, desiredHeight] = [
    pixelRatio * clientWidth, pixelRatio * clientHeight]
  const aspectRatio = clientWidth / clientHeight

  if (width !== desiredWidth || height !== desiredHeight)
    renderer.setSize(desiredWidth, desiredHeight, false)

  if (camera.aspect !== aspectRatio) {
    camera.aspect = aspectRatio

    camera.updateProjectionMatrix()
  }
}

function onWindowResize () {
  configureRendererAndCamera()
  renderScene()
}

function setupEventListeners () {
  window.addEventListener('resize', onWindowResize)
}

function cleanupThree () {
  window.removeEventListener('resize', onWindowResize)
}

function saveString (aTag, string, filename) {
  const blob = new Blob([string], { type: 'application/json' }, filename)

  const url = URL.createObjectURL(blob)
  aTag.href = url
  aTag.download = filename

  // aTag.click()
  // setTimeout(() => {
  //   URL.revokeObjectURL(url)
  // }, 1000)
}

export {
  initThree,
  cleanupThree
}