import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, PlaneGeometry, BufferGeometry,
  MeshLambertMaterial, MeshStandardMaterial, MeshPhongMaterial, MeshBasicMaterial,
  AmbientLight, DirectionalLight, Object3D, Vector3,
  BufferAttribute, SphereGeometry, Color, VertexColors
} from 'three'
import { Axes, PlaneXY } from './utils.js'
import { degreeToRadian } from '@view-util'
import * as dat from 'dat.gui'
let renderer, scene, camera, axes, plane, cone
let animationRequestId = null
let ambientLight, directionalLight

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
  const [fov, nearPlane, farPlane] = [45, 0.1, 1000]
  camera = new PerspectiveCamera(fov, 1, nearPlane, farPlane)

  initRendererAndCamera()
  setupEventListeners()

  // axes & planes
  axes = new Axes({ color: colors.line, size: 100 })

  const customPlane = new PlaneXY({ 
    color: colors.line, width: planeWidth, height: planeHeight })
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

  // add objects
  const pC = new Vector3(planeWidth/2, 0.1, planeHeight/2) // plane center
  const [sideLength, hornHeight] = [10, 10]
  const s2 = sideLength/2

  const geometry = new BufferGeometry()
  const material = new MeshBasicMaterial({ color: '#FFFF00', side: 'double' })
  const vertexInfos = {
    p1: { coor: [pC.x - s2, pC.y, pC.z - s2], color: [51, 51, 0] },
    p2: { coor: [pC.x - s2, pC.y, pC.z + s2], color: [102, 102, 0] },
    p3: { coor: [pC.x + s2, pC.y, pC.z + s2], color: [153, 153, 0] },
    p4: { coor: [pC.x + s2, pC.y, pC.z + s2], color: [204, 204, 0] },
    h1: { coor: [pC.x, hornHeight, pC.z], color: [255, 255, 0] }
  }
  let verticesArr = [], colorsArr = []
  const faceArr = [
    'p1', 'p2', 'h1',
    'p2', 'p3', 'h1',
    'p3', 'p4', 'h1',
    'p4', 'p1', 'h1'
  ]
  
  faceArr.forEach(vertexKey => {
    verticesArr = [ ...verticesArr, ...vertexInfos[vertexKey].coor ]
    colorsArr = [ ...colorsArr, ...vertexInfos[vertexKey].color ]
  })

  verticesArr = new Float32Array(verticesArr)
  colorsArr = new Uint8Array(colorsArr)

  console.log('verticesArr: ', verticesArr)
  geometry.setAttribute('position', new BufferAttribute(verticesArr, 3))
  // geometry.setAttribute('color', new BufferAttribute(colorsArr, 3, true))

  cone = new Mesh(geometry, material)

  scene.add(cone)
  // camera helper
  // scene.add(new CameraHelper(directionalLight.shadow.camera))

  render()
  animate()
}

function animate () {
  animationRequestId = requestAnimationFrame(animate)

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
  camera.position.set(-70, 70, 70)
  camera.lookAt(planeWidth/2, 1, planeHeight/2)
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