import * as THREE from 'three'
const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, PlaneGeometry, MeshLambertMaterial,
  AmbientLight, DirectionalLight, Object3D,
  DoubleSide
} = THREE
import { Axes, PlaneXY, CombineMaterial } from './utils.js'
import { degreeToRadian } from '@view-util'
import * as dat from 'dat.gui'
let renderer, scene, camera, axes, plane, object
let animationRequestId = null
let ambientLight, directionalLight
let angleSpeed = 0, rotateSpeed = 0

const render = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [60, 60]
const gui = { controller: null, panel: null }
const colors = {
  objects: ['#F2059F', '#F2E205', '#F24405', '#418FBF'],
  line: '#BFBAB0',
  plane: '#7D6B7D',
  ambientLight: '#DDDDDD',
  directionalLight: '#FFFFFF'
}

function initThree (canvasEl) {
  renderer = new WebGLRenderer({ canvas: canvasEl })
  scene = new Scene()

  // camera
  const [fov, nearPlane, farPlane] = [45, 40, 500]
  camera = new PerspectiveCamera(fov, 1, nearPlane, farPlane)

  initRendererAndCamera()
  setupEventListeners()

  // axes & planes
  axes = new Axes({ color: colors.line, size: 100 })

  const customPlane = new PlaneXY({ 
    color: colors.line, width: planeWidth, height: planeHeight
  })
  customPlane.rotation.x = -0.5 * Math.PI
  customPlane.position.z = planeHeight

  plane = new Mesh(
    new PlaneGeometry(planeWidth, planeHeight, 1, 1),
    new MeshLambertMaterial({ 
      color: colors.plane, transparent: true,
      opacity: 0.45, side: 'double'
    })
  )
  plane.rotation.x = -0.5 * Math.PI
  plane.position.set(planeWidth/2, 0, planeHeight/2)
  plane.receiveShadow = true

  scene.add(customPlane)
  scene.add(axes)
  scene.add(plane)

  // lights
  ambientLight = new AmbientLight(colors.ambientLight)
  directionalLight = new DirectionalLight(colors.ambientLight, 1)

  const dirLightTarget = new Object3D()
  dirLightTarget.position.set(planeWidth/2, 0.1, planeHeight/2)

  directionalLight.castShadow = true
  directionalLight.position.set(-1 * planeWidth/2, 90, -1 * planeHeight/2)
  directionalLight.target = dirLightTarget 

  directionalLight.shadow.camera.left = -100
  directionalLight.shadow.camera.right = 100
  directionalLight.shadow.camera.top = 100
  directionalLight.shadow.camera.bottom = -100

  scene.add(ambientLight)
  scene.add(directionalLight)
  scene.add(directionalLight.target)

  // camera helper
  // scene.add(new CameraHelper(directionalLight.shadow.camera))

  const objectSide = 20
  object = new CombineMaterial(
    new THREE.CircleGeometry(10, 32),
    [
      new MeshLambertMaterial({ 
        color: colors.objects[1], side: DoubleSide, transparent: true, opacity: 0.5,
        blending: THREE.NormalBlending
      }),
      new MeshLambertMaterial({ color: '#6A6A6A', side: DoubleSide, wireframe: true })
    ], true
  )
  object.position.set(planeWidth/2, objectSide/2, planeHeight/2)
  object.castShadow = true
  scene.add(object)

  render()
  animate()
}

function animate () {
  animationRequestId = requestAnimationFrame(animate)

  angleSpeed += degreeToRadian(0.5)
  rotateSpeed += degreeToRadian(3)
  object.rotation.x = angleSpeed
  object.rotation.z = angleSpeed

  object.children[0].geometry = new THREE.CircleGeometry(10, 32, rotateSpeed, Math.PI/2)

  render()
}

function initRendererAndCamera () {
  const pixelRatio = window.devicePixelRatio || 1
  const { width, height, clientHeight, clientWidth } = renderer.domElement
  const [desiredWidth, desiredHeight] = [clientWidth * pixelRatio, clientHeight * pixelRatio]
  const aspectRatio = clientWidth / clientHeight

  if (desiredWidth !== width || desiredHeight !== height)
    renderer.setSize(desiredWidth, desiredHeight, false)

  renderer.shadowMap.enabled = true
  renderer.setClearColor('#FFFFFF')

  camera.aspect = aspectRatio
  camera.updateProjectionMatrix()
  camera.position.set(70, 80, 70)
  camera.lookAt(planeWidth/2, 0.5, planeHeight/2)
}

function setupEventListeners () {
  window.addEventListener('resize', onScreenResize)
}

function onScreenResize () {
  initRendererAndCamera()
  render()
}

// helper funcs

export {
  initThree
}