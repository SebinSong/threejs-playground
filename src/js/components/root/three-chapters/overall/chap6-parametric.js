import * as THREE from 'three'
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js'
import { Axes, PlaneXY, CombineMaterial, 
  getGeometryBoundingBox, OrbitControls } from './utils.js'
import { degreeToRadian, randomBetween } from '@view-util'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  PlaneGeometry,
  Mesh, MeshLambertMaterial, MeshBasicMaterial,
  AmbientLight, SpotLight,
  Vector3, Color, Object3D
} = THREE

let renderer, scene, camera, orbitControl
let ambientLight, spotLight
let axes, customPlane, plane, parametricObj, parametricPlane
let animationId = null

const renderScene = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [60, 60]
const gui = { controller: null, panel: null }
const cameraSettings = {
  fov: 45, near: 0.1, far: 1000,
  position: new Vector3(planeWidth * 1.1, Math.max(planeWidth, planeHeight) * 1.5, planeHeight * 1.1),
  lookAt: [planeWidth/2, 0, planeHeight/2]
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

  // control
  orbitControl = new OrbitControls(camera, canvasEl)
  orbitControl.screenSpacePanning = true
  orbitControl.update()

  configureRendererAndCamera()
  setupEventListeners()

  // axes & planes
  customPlane = new PlaneXY({
    color: colors.line,
    width: planeWidth, height: planeHeight
  })
  customPlane.rotation.x = -0.5 * Math.PI
  customPlane.position.y = 0.1
  customPlane.position.z = planeHeight

  axes = new Axes({
    color: colors.line, size: Math.max(planeWidth, planeHeight) * 1.2
  })

  plane = new Mesh(
    new PlaneGeometry(planeWidth, planeHeight, 1, 1),
    new MeshLambertMaterial({ color: colors.plane,
      transparent: true, opacity: 0.65, side: THREE.DoubleSide })
  )
  plane.rotation.x = Math.PI * -0.5
  plane.position.set(planeWidth/2, 0, planeHeight/2)
  plane.receiveShadow = true

  scene.add(customPlane)
  scene.add(axes) 
  scene.add(plane)

  // lights
  ambientLight = new AmbientLight(colors.ambientLight)
  spotLight = new SpotLight(colors.light, 1.25)
  spotLight.position.set(planeWidth/2, 100, planeHeight/2)
  spotLight.target = new Object3D()
  spotLight.target.position.set(planeWidth/2, 0, planeHeight/2)
  spotLight.castShadow = true

  scene.add(ambientLight)
  scene.add(spotLight)
  scene.add(spotLight.target)

  // objects - 1
  const paraFunc = (u, v, target) => { target.set(4*u, 4*v, Math.pow(4*u, 1.5) + Math.pow(4*v, 1.5)) }
  const paraGeo = new ParametricGeometry(paraFunc)
  parametricObj = new CombineMaterial(
    paraGeo, [
      new MeshLambertMaterial({ color: colors.objects[3], transparent: true, opacity: 0.6,
        side: THREE.DoubleSide }),
      new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.3,
        side: THREE.DoubleSide, wireframe: true })
    ], true
  )
  parametricObj.rotation.x = Math.PI * -0.5
  parametricObj.position.set(planeWidth/2, 1, planeHeight/2)
  
  const pCopy1 = CombineMaterial.clone(parametricObj)
  pCopy1.rotation.z = Math.PI * 0.5

  scene.add(parametricObj)
  scene.add(pCopy1)

  // object - 2
  const paraPlaneFunc = (u, v, target) => {
    const r = 30

    target.set(
      Math.sin(u) * r,
      Math.sin(u * 4 * Math.PI) + Math.cos(v * 2 * Math.PI) * 2.8,
      Math.sin(v / 2) * 2 * r
    )
  }
  parametricPlane = new CombineMaterial(
    new ParametricGeometry(paraPlaneFunc, 64, 64),
    [
      new MeshLambertMaterial({ color: colors.objects[2], transparent: true, opacity: 0.6,
        side: THREE.DoubleSide }),
      new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.4,
        side: THREE.DoubleSide, wireframe: true })
    ], true
  )
  parametricPlane.position.set(20, 20, 20)

  scene.add(parametricPlane)

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

  orbitControl.update()
}

function onScreenResize () {
  configureRendererAndCamera()
  renderScene()
}

export {
  initThree
}
