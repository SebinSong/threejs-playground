import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh,
  PlaneGeometry, MeshLambertMaterial, AmbientLight, SpotLight,
  FogExp2
} from 'three'
import { Axes, PlaneXY, Cube } from './utils.js'
import { randomFromArray, randomIntFromRange } from '@view-util'
import * as dat from 'dat.gui'

let renderer, scene, camera, axes, plane
let spotLight, ambientLight, fog
let animationRequestId = null

const MAX_CUBE_NUMBER = 50
const [planeWidth, planeHeight] = [60, 60]
const cubes = []

const render = () => renderer.render(scene, camera)
const colors = {
  line: '#BFBAB0',
  plane: '#7D6B7D',
  light: '#FFFFFF',
  cubes: ['#F2059F', '#418FBF', '#F2E205', '#F24405']
}

const gui = { controller: null, panel: null }

function initThree (canvasEl) {
  renderer = new WebGLRenderer({ canvas: canvasEl })
  scene = new Scene()

  // camera
  const [fov, nearPlane, farPlane] = [45, 0.1, 1000]
  camera = new PerspectiveCamera(fov, 1, nearPlane, farPlane)

  initRendererAndCamera()
  setupEventListeners()
  setupGUI()

  // create coordinate axes & plane
  axes = new Axes({ color: colors.line, size: 120 })

  const customXYPlane = new PlaneXY({ color: colors.line, width: planeWidth, height: planeHeight })
  customXYPlane.rotation.x = -0.5 * Math.PI
  customXYPlane.position.z = planeHeight

  plane = new Mesh(
    new PlaneGeometry(planeWidth, planeHeight, 1, 1),
    new MeshLambertMaterial({ color: colors.plane, transparent: true, opacity: 0.35 })
  )
  plane.rotation.x = -0.5 * Math.PI
  plane.position.set(planeWidth/2, 0, planeHeight/2)
  plane.receiveShadow = true

  scene.add(plane)
  scene.add(customXYPlane)
  scene.add(axes)

  // lights
  ambientLight = new AmbientLight(colors.light)
  ambientLight.name = 'ambient-light'
  scene.add(ambientLight)

  spotLight = new SpotLight(colors.light)
  spotLight.position.set(-40, 60, -10)
  spotLight.castShadow = true
  scene.add(spotLight)

  // fog
  fog = new FogExp2('#BFBAB0', 0.01)
  scene.fog = fog

  // overrideMaterial
  // scene.overrideMaterial = new MeshLambertMaterial({ color: colors.cubes[0] })
  // console.log('child lookup by name: ', scene.getObjectByName('ambient-light'))

  render()
  animate()
}

// helpers
function degreeToRadian (deg) { return deg / 180 * Math.PI }

function animate () {
  animationRequestId = window.requestAnimationFrame(animate)

  const rotationSpeed = degreeToRadian(gui.controller.rotationSpeed)
  cubes.forEach(cube => {
    cube.rotation.x += rotationSpeed
    cube.rotation.y += rotationSpeed
  })

  render()
}

function setupGUI () {
  gui.panel = new dat.GUI()

  const rotationSettings = { init: 3, min: 1, max: 30, increment: 1 }
  const addCube = () => {
    if (cubes.length === MAX_CUBE_NUMBER)
      return

    const cubeSize = Math.floor(1 + 5 * Math.random())
    const randomAngle = () => degreeToRadian(randomIntFromRange(1, 90))

    const cube = new Cube({
      size: cubeSize,
      index: cubes.length,
      color: randomFromArray(colors.cubes),
      scene: scene
    })
    cube.position.set(
      randomIntFromRange(cubeSize/2, planeWidth - cubeSize/2),
      cubeSize,
      randomIntFromRange(cubeSize/2, planeHeight - cubeSize/2)
    )
    cube.rotation.x = randomAngle()
    cube.rotation.y = randomAngle()

    cubes.push(cube)
    scene.add(cube)

    gui.controller.numOfCubes++

  }
  const removeCube = () => {
    const cube = cubes.pop()
    cube.remove()

    gui.controller.numOfCubes--
  }

  const outputCubes = () => {
    const cubes = scene.children.filter(child => child instanceof Cube)
    console.log('all cubes that are currently in the scene: ', cubes)
  }
  
  gui.controller = {
    rotationSpeed: rotationSettings.init,
    numOfCubes: cubes.length,
    addCube, removeCube, outputCubes
  }

  const { min, max, increment } = rotationSettings
  gui.panel.add(gui.controller, 'rotationSpeed', min, max, increment)
  gui.panel.add(gui.controller, 'addCube')
  gui.panel.add(gui.controller, 'removeCube')
  gui.panel.add(gui.controller, 'outputCubes')
  gui.panel.add(gui.controller, 'numOfCubes').listen()
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
  camera.position.set(80, 80, 80)
  camera.lookAt(planeWidth/2,0, planeHeight/2)
  // camera.rotation.z = Math.PI * 0.825
}

function setupEventListeners () {
  window.addEventListener('resize', initRendererAndCamera)
}

export {
  initThree
}