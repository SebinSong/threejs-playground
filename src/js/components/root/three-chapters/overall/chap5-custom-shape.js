import * as THREE from 'three'
import { MeshBasicMaterial } from 'three'
import { Axes, PlaneXY, CombineMaterial,
  getGeometryBoundingBox } from './utils.js'
import { degreeToRadian } from '@view-util'

const { 
  WebGLRenderer, Scene, PerspectiveCamera,
  Color, Vector2, Vector3, Object3D, 
  Mesh, PlaneGeometry, ShapeGeometry,
  MeshLambertMaterial, AmbientLight, SpotLight,
  CameraHelper, Shape, Line, LineBasicMaterial, BufferGeometry, Path
} = THREE

let renderer, scene, camera, ambientLight, spotLight, cameraHelper
let animationRequestId
let axes, customPlane, plane, object, object2

const renderScene = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [60, 60]
const gui = { controller: null, panel: null }
const cameraSettings = {
  fov: 45, near: 0.1, far: 1000,
  position: [70, 80, 70],
  lookAt: [planeWidth/2, 1, planeHeight/2]
  // position: [0, 60, 200],
  // lookAt: [0, 60, 0]
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

  // object
  const objGeometry = new ShapeGeometry(drawShape('heart'))

  object = new CombineMaterial(
    objGeometry,
    [
      new MeshLambertMaterial({ 
        color: colors.objects[2], transparent: true, opacity: 0.75,
        blending: THREE.NormalBlending, side: THREE.DoubleSide
      }),
      new MeshLambertMaterial({ 
        color: colors.line, wireframe: true, side: THREE.DoubleSide
      })
    ], true
  )

  const heartBBox = getGeometryBoundingBox(objGeometry)
  const { center: heartCenter  } = heartBBox

  object.rotation.x = -0.5 * Math.PI
  object.scale.set(0.25, 0.25, 0.25)
  object.position.set(planeWidth/2 - heartCenter.x * 0.25, 10, planeHeight/2 + heartCenter.y * 0.25)

  scene.add(object)

  // arc

  object2 = new Mesh(
    new ShapeGeometry(drawShape('arc')),
    new MeshLambertMaterial({ 
      color: colors.objects[3], transparent: true, opacity: 0.75,
      blending: THREE.NormalBlending, side: THREE.DoubleSide
    })
  )
  // object2.rotation.x = degreeToRadian(45)
  // object2.position.set(4, 0.1, 4)
  object2.castShadow = true

  let arcPoints = object2.geometry.parameters.shapes.extractPoints(20)
  arcPoints = arcPoints.shape.map(({ x, y }) => new Vector3(x, y, 0))
  
  const bufGeo = new BufferGeometry()
  bufGeo.setFromPoints(arcPoints)
  console.log('arcPoints: ', arcPoints)

  const lineMaterial = new LineBasicMaterial({ color: '#000000' })
  const lineMesh = new Line(bufGeo, lineMaterial)
  lineMesh.computeLineDistances()

  scene.add(object2)
  scene.add(lineMesh)

  renderScene()
  animate()
}

function drawShape (shapeName = '') {
  const shape = new Shape()
  const hole = new Path()
  hole.arc(7, 1, 2, 0, Math.PI*2, false)

  switch (shapeName) {
    case 'arc':
      shape.moveTo(0, 0)
      shape.arc(10, 0, 8, 0, Math.PI * 0.75, true)
      shape.holes.push(hole)
      break;
    case 'heart':
      shape.moveTo(25, 25)
      shape.bezierCurveTo(25, 25, 20, 0, 0, 0)
      shape.bezierCurveTo(-30, 0, -30, 35, -30, 35)
      shape.bezierCurveTo(-30, 55, -10, 77, 25, 95)
      shape.bezierCurveTo(60, 77, 80, 55, 80, 35)
      shape.bezierCurveTo(80, 35, 80, 0, 50, 0)
      shape.bezierCurveTo(25, 0, 25, 25, 25, 25)
      break;
    default: 
      shape.moveTo(0,0)
      shape.lineTo(8, 8)
      shape.splineThru([
        new Vector2(12, 6), 
        new Vector2(15, 10), 
        new Vector2(18, 7)
      ])
      shape.quadraticCurveTo(23, 5 ,27, 0)
  }
  // shape.lineTo(0,0)
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
  configureRendererAndCamera()
  renderScene()
}


export {
  initThree
}