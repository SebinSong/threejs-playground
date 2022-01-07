import * as THREE from 'three'
import { Axes, PlaneXY, CombineMaterial, getGeometryBoundingBox } from './utils.js'
import { degreeToRadian, randomBetween } from '@view-util'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  CatmullRomCurve3, EllipseCurve,
  PlaneGeometry, TubeGeometry,
  Mesh, MeshLambertMaterial, MeshBasicMaterial,
  AmbientLight, SpotLight,
  Vector3, Color, Object3D
} = THREE

let renderer, scene, camera
let ambientLight, spotLight
let axes, customPlane, plane, tubeObj, tube2, tube3
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
  const tubeRefPoint = new Vector3(planeWidth/2, 20, planeHeight/2)
  const tubePoints = [];
  const [pointNumber, tubularSegments, tubeRadius, tubeRadialSegments] = [
    8, 64, 1, 8
  ];
  
  (function () {
    for (let p=0; p<pointNumber; p++) {
      tubePoints.push(
        new Vector3(
          tubeRefPoint.x + randomBetween(-10, 10),
          tubeRefPoint.y + randomBetween(-10, 10),
          tubeRefPoint.z + randomBetween(-10, 10)
        )
      )
    }
  })()
  
  const tubeGeo = new TubeGeometry(
    new CatmullRomCurve3(tubePoints), tubularSegments, 
    tubeRadius, tubeRadialSegments)
  const tubeMaterials = [
    new MeshLambertMaterial({ color: colors.objects[2], transparent: true, 
      opacity: 0.7, side: THREE.DoubleSide }),
    new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.25,
      wireframe: true })
  ]
  const tube2Points = [];

  (function () {
    const num = 8;
    const zUnit = Math.floor(planeHeight / num)

    for (let p=0; p<8; p++) {
      tube2Points.push(
        new Vector3(5, 12 + randomBetween(-6, 6), zUnit * (p + 1))
      )
    }
  })()

  tubeObj = new CombineMaterial(tubeGeo, tubeMaterials, true)
  tube2 = new CombineMaterial(
    new TubeGeometry(new CatmullRomCurve3(tube2Points), tubularSegments, 
      tubeRadius, tubeRadialSegments),
      [
        new MeshLambertMaterial({ color: colors.objects[3], transparent: true, 
          opacity: 0.7, side: THREE.DoubleSide }),
        new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.25,
          wireframe: true })
      ], true
  )
  tube3 = new CombineMaterial(
    new TubeGeometry(drawShape(), tubularSegments, tubeRadius, tubeRadialSegments), 
    [
      new MeshLambertMaterial({ color: colors.objects[4], transparent: true, 
        opacity: 0.7, side: THREE.DoubleSide }),
      new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.25,
        wireframe: true })
    ], true
  )

  scene.add(tubeObj)
  scene.add(tube2)
  scene.add(tube3)

  // render & animation
  renderScene()
  animate()
}

function animate () {
  animationId = window.requestAnimationFrame(animate)
  
  renderScene()
}

function drawShape () {
  return new EllipseCurve(0, 0, 10, 6, 0, Math.PI * 2 / 3, false)
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
