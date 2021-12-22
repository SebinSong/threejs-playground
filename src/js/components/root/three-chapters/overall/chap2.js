import {
  WebGLRenderer, Scene, PerspectiveCamera, 
  Color, AxesHelper, Group
} from 'three'
import { Axes, PlaneXY } from './utils.js'
import * as dat from 'dat.gui'

let renderer, scene, camera, axes
const render = () => renderer.render(scene, camera)
const colors = {
  line: '#BFBAB0'
}

const gui = { controller: null, panel: null }

function initThree (canvasEl) {
  renderer = new WebGLRenderer({ canvas: canvasEl })
  scene = new Scene()
  // scene.rotation.x = -0.5 * Math.PI

  // camera
  const [fov, nearPlane, farPlane] = [45, 0.1, 1000]
  camera = new PerspectiveCamera(fov, 1, nearPlane, farPlane)

  initRendererAndCamera()
  setupEventListeners()
  setupGUI()

  // create coordinate axes
  const customAxes = new Axes({ color: colors.line })
  const customXYPlane = new PlaneXY({ color: colors.line })
  scene.add(customAxes)
  scene.add(customXYPlane)

  render()
}

// helpers
function degreeToRadian (deg) { return deg / 180 * Math.PI }

function setupGUI () {
  gui.panel = new dat.GUI()
}

function initRendererAndCamera () {
  const pixelRatio = window.devicePixelRatio || 1
  const el = renderer.domElement
  const { 
    width: currentW, height: currentH,
    clientWidth, clientHeight
  } = el
  const [ desiredW, desiredH ] = [ clientWidth * pixelRatio, clientHeight * pixelRatio ]
  const aspectRatio = desiredW / desiredH

  if (currentW !== desiredW || currentH !== desiredH)
    renderer.setSize(desiredW, desiredH, false)

  renderer.setClearColor('#FFFFFF')
  renderer.shadowMap.enabled = true

  camera.aspect = aspectRatio
  camera.updateProjectionMatrix()

  // camera position
  camera.position.set(20, 20, 20)
  camera.lookAt(0,0,0)
  // camera.rotation.z = Math.PI * 0.75
}

function setupEventListeners () {
  window.addEventListener('resize', initRendererAndCamera)
}

export {
  initThree
}