import * as THREE from 'three'
import { Axes, PlaneXY, CombineMaterial, getGeometryBoundingBox } from './utils.js'
import { degreeToRadian } from '@view-util'
import { Combine } from 'three'
import { Triangle } from 'three'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  PlaneGeometry, ShapeGeometry, ExtrudeGeometry,
  Mesh, MeshLambertMaterial, MeshBasicMaterial, MeshNormalMaterial,
  AmbientLight, SpotLight,
  Vector3, Color, Object3D, Path, Shape,
} = THREE

let renderer, scene, camera
let ambientLight, spotLight
let axes, customPlane, plane, shape, extrude
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

  // objects
  shape = new CombineMaterial(
    new ShapeGeometry(drawShape()),
    [
      new MeshLambertMaterial({
        color: colors.objects[2], side: THREE.DoubleSide,
      })
    ], true
  )

  const extrudeOpts = {
    curveSegments: 40,
    steps: 10, depth: 12, bevelEnabled: false,
    bevelThickness: 1, bevelSize: 1, bevelOffset: 0, bevelSegments: 1
  }

  extrude = new Mesh(
    new ExtrudeGeometry(drawShape(), extrudeOpts),
    new MeshLambertMaterial({ color: colors.objects[1], side: THREE.DoubleSide,
      transparent: true, opacity: 0.8 })
  )
  extrude.position.set(planeWidth/2, 20, planeHeight/2 - 6)
  extrude.castShadow = true

  scene.add(shape)
  scene.add(extrude)

  // render & animation
  renderScene()
  animate()
}

function animate () {
  animationId = window.requestAnimationFrame(animate)

  extrude.rotation.x += degreeToRadian(0.6)
  extrude.rotation.y += degreeToRadian(0.4)
  extrude.rotation.z += degreeToRadian(0.3)
  
  renderScene()
}

function drawShape () {
  const shape = new Shape()

  shape.moveTo(-12,0)
  shape.absellipse(0, 0, 12, 8, 0, 2 * Math.PI, true, 0)
  shape.closePath()

  // draw holes
  const hole1 = new Path()
  hole1.moveTo(-2, 0)
  hole1.lineTo(-2, 3)
  hole1.arc(2, 0, 2, Math.PI, 0, true)
  hole1.lineTo(2, -3)
  hole1.absarc(0, -3, 2, 0, Math.PI, true)
  hole1.lineTo(-2, 0)

  const hole2 = new Path()
  hole2.moveTo(4, 0)
  hole2.lineTo(4, 2)
  hole2.arc(1, 0, 1, Math.PI, 0, true)
  hole2.lineTo(6, -2)
  hole2.absarc(5, -2, 1, 0, Math.PI, true)
  hole2.lineTo(4, 0)

  const hole3 = new Path()
  hole3.moveTo(-4, 0)
  hole3.lineTo(-4, 2)
  hole3.arc(-1, 0, 1, 0, Math.PI, false)
  hole3.lineTo(-6, -2)
  hole3.absarc(-5, -2, 1, Math.PI, 0, false)
  hole3.lineTo(-4, 0)

  shape.holes.push(hole1)
  shape.holes.push(hole2)
  shape.holes.push(hole3)

  return shape
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