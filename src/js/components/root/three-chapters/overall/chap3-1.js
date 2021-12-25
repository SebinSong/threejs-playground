import { WebGLRenderer, Scene, Color,
  PerspectiveCamera, Mesh, PlaneGeometry,
  MeshLambertMaterial, AmbientLight
} from 'three'
import { Axes, PlaneXY, Cube } from './utils.js'
import { randomFromArray, randomIntFromRange } from '@view-util'
import * as dat from 'dat.gui'
import { color } from 'dat.gui'

let renderer, scene, camera, axes, plane
let ambientLight

const render = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [60, 60]

const colors = {
  objects: ['#F2059F', '#418FBF', '#F2E205', '#F24405'],
  line: '#BFBAB0',
  plane: '#7D6B7D',
  light: '#FFFFFF'
}

function initThree (canvasEl) {
  renderer = new WebGLRenderer({ canvas: canvasEl })
  scene = new Scene()

  // camera
  const [fov, nearPlane, farPlane] = [fov, nearPlane, farPlane]
  camera = new PerspectiveCamera(fov, 1, nearPlane, farPlane)

  initRendererAndCamera()
  setupEventListeners()

  // axes & plane
  axes = new Axes({ color: colors.line, size: 100 })

  const customPlane = new PlaneXY({ color: colors.line, width: planeWidth, height: planeHeight })
  customPlane.rotation.x = -0.5 * Math.PI
  customPlane.position.z = planeHeight

  plane = new Mesh (
    new PlaneGeometry(planeWidth, planeHeight, 1, 1),
    new MeshLambertMaterial({ color: colors.plane, transparent: true, opacity: 0.4 })
  )
  plane.rotation.x = -0.5 * Math.PI
  plane.position.set(planeWidth/2, 0, planeHeight/2)
  plane.receiveShadow = true

  scene.add(plane)
  scene.add(axes)
  scene.add(customPlane)

  // lights
  ambientLight = new AmbientLight(colors.light)
  scene.add(ambientLight)

  render()
}

function initRendererAndCamera () {
  const pixelRatio = window.devicePixelRatio || 1
  const { clientWidth, clientHeight, width, height } = renderer.domElement
  const [ desiredWidth, desiredHeight ] = [ clientWidth * pixelRatio, clientHeight * pixelRatio ]
  const aspectRatio = desiredWidth / desiredHeight

  if (width !== desiredWidth || height !== desiredHeight)
    renderer.setSize(desiredWidth, desiredHeight, false)

  renderer.shadowMap.enabled = true
  renderer.setClearColor('#FFFFFF')

  camera.aspect = aspectRatio
  camera.updateProjectionMatrix()
  camera.position.set(80, 80, 80)
  camera.lookAt(planeWidth/2, 0, planeHeight/2)
}

function setupEventListeners () {
  window.addEventListener('resize', onScreenResize)
}

function onScreenResize () {
  initRendererAndCamera()
  render()
}
export {
  initThree
}