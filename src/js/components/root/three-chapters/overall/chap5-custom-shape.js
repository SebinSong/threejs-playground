import * as THREE from 'three'
import { Axes, PlaneXY } from './utils.js'

const { 
  WebGLRenderer, Scene, PerspectiveCamera,
  Color, Vector3, Vector2, Object3D, 
  Mesh, PlaneGeometry, ShapeGeometry,
  MeshLambertMaterial, AmbientLight, SpotLight,
  CameraHelper, Shape
} = THREE

let renderer, scene, camera, ambientLight, spotLight, cameraHelper
let animationRequestId
let axes, customPlane, plane, object

const renderScene = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [60, 60]
const gui = { controller: null, panel: null }
const cameraSettings = {
  fov: 45, near: 0.1, far: 1000,
  position: [70, 80, 70],
  lookAt: [planeWidth/2, 1, planeHeight/2]
}
const colors = {
  objects: ['#F2059F', '#F2E205', '#F24405', '#418FBF'],
  line: '#BFBAB0',
  plane: '#7D6B7D',
  light: '#DDDDDD'
}

function initThree (canvasEl) {
  // init renderer and the scene
  renderer = new WebGLRenderer({ canvas: canvasEl })
  scene = new Scene()

  renderer.setClearColor(new Color('#FFFFFF'))
  renderer.shadowMap.enabled = true

  // create a camera instance
  const { fov, near, far, position, lookAt } = cameraSettings

  camera = new PerspectiveCamera(fov, 1, near, far)
  camera.position.set(...position)
  camera.lookAt(...lookAt)

  configureRendererAndCamera()
  setupEventListeners()

  // axes & planes
  customPlane = new PlaneXY({
    color: colors.line,
    width: planeWidth, height: planeHeight
  })
  customPlane.rotation.x = -0.5 * Math.PI
  customPlane.position.z = planeHeight

  axes = new Axes({ 
    color: colors.line, 
    size: Math.max(planeWidth, planeHeight) * 1.25
  })

  plane = new Mesh(
    new PlaneGeometry(planeWidth, planeHeight, 1, 1),
    new MeshLambertMaterial({ 
      color: colors.plane, transparent: true, opacity: 0.45,
      side: THREE.DoubleSide
    })
  )
  plane.rotation.x = -0.5 * Math.PI
  plane.position.set(planeWidth/2, 0, planeHeight/2)
  plane.receiveShadow = true

  scene.add(customPlane)
  scene.add(axes)
  scene.add(plane)

  // lights
  ambientLight = new AmbientLight(colors.light)
  spotLight = new SpotLight(colors.light, 1)

  spotLight.position.set(planeWidth/2, 100, planeHeight/2)
  spotLight.target = new Object3D()
  spotLight.target.position.set(planeWidth/2, 0.1, planeHeight/2)
  spotLight.castShadow = true

  cameraHelper = new CameraHelper(spotLight.shadow.camera)

  scene.add(ambientLight)
  scene.add(spotLight)
  scene.add(spotLight.target)
  scene.add(cameraHelper)


  renderScene()
  animate()
}

function drawShape () {
  const shape = new Shape()

  shape.moveTo(0,0)
  shape.lineTo(30, 30)
  shape.splineThru([
    new Vector2(40, 20), 
    new Vector2(50, 40), 
    new Vector2(60, 20)
  ])
  shape.quadraticCurveTo(50, 10 ,40, 0)
  shape.lineTo(0,0)

  return shape
}

function configureRendererAndCamera () {
  const pixelRatio = window.devicePixelRatio || 1
  const { width, height, clientHeight, clientWidth } = renderer.domElement
  const [desiredWidth, desiredHeight] = [clientWidth * pixelRatio, clientHeight * pixelRatio]
  const aspectRatio = clientWidth / clientHeight

  if (width !== desiredWidth || height !== desiredHeight)
    renderer.setSize(desiredWidth, desiredHeight, false)

  if (camera.aspect !== aspectRatio) {
    camera.aspect = aspectRatio
    camera.updateProjectionMatrix()
  }
}

function animate () {
  animationRequestId = window.requestAnimationFrame(animate)
  
  renderScene()
}

function setupEventListeners () {
  window.addEventListener('resize', onScreenResize)
}

function onScreenResize () {
  initRendererAndCamera()
  renderScene()
}


export {
  initThree
}