import * as THREE from 'three'
import { Axes, PlaneXY, CombineMaterial, getGeometryBoundingBox } from './utils.js'
import { degreeToRadian, randomSign } from '@view-util'
import { Group } from 'three'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';

const {
  WebGLRenderer, Scene, PerspectiveCamera, Vector3, Vector2, Object3D, Color,
  Box3, Box3Helper,
  Mesh, MeshLambertMaterial, MeshPhongMaterial, MeshBasicMaterial,
  PlaneGeometry, SphereGeometry, LatheGeometry,
  AmbientLight, SpotLight
} = THREE

let renderer, scene, camera
let ambientLight, spotLight
let animationId = null
let axes, customPlane, plane, lathe1

const renderScene = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [80, 80]
const gui = { controller: null, panel: null }
const cameraSettings = {
  fov: 45, near: 0.1, far: 1000, 
  position: new Vector3(planeWidth * 1.1, Math.max(planeWidth, planeHeight) * 1.5, planeHeight * 1.1),
  lookAt: [planeWidth/2, 0, planeHeight/2]
}
const colors = {
  objects: ['#F2059F', '#F2E205', '#F24405', '#418FBF', '#D9ADD2', '#AD24BF', '#F2C063'],
  line: '#6A6A6A',
  plane: '#3C5659',
  light: '#FFFFFF',
  ambientLight: '#888888'
}

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({ 
    canvas: canvasEl, antialias: true })
  scene = new Scene()

  renderer.setClearColor(new Color('#FFFFFF'))
  renderer.shadowMap.enabled = true;

  // camera
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
    color: colors.line,
    size: Math.max(planeWidth, planeHeight) * 1.2
  })

  plane = new Mesh(
    new PlaneGeometry(planeWidth, planeHeight, 1, 1),
    new MeshLambertMaterial({ color: colors.plane, 
      transparent: true, opacity: 0.55, side: THREE.DoubleSide })
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
  spotLight.target.position.set(planeWidth/2, 0.1, planeHeight/2)
  spotLight.castShadow = true

  scene.add(ambientLight)
  scene.add(spotLight)
  scene.add(spotLight.target);

  // objects
  (function () {
    const lathePoints = []
    const [height, count] = [4, 30]

    for (let i=0; i<count; i++) {
      lathePoints.push(
        new Vector2(
          (Math.sin(i*0.14) + Math.cos(i*0.2)) * height + 8,
          (i - count) + count/2
        )
      )
    }

    lathe1 = new CombineMaterial(
      new LatheGeometry(lathePoints, 32, 0, Math.PI * 2),
      [
        new MeshPhongMaterial({ color: colors.objects[0], shininess: 80, side: THREE.DoubleSide }),
        new MeshBasicMaterial({ color: '#9D9D9D', transparent: true, opacity: 0.4, wireframe: true })
      ], true
    )

    const { height: objHeight } = getGeometryBoundingBox(lathe1.geometry)
    lathe1.position.set(planeWidth/2, objHeight/2 + 24, planeHeight/2)
  })()

  scene.add(lathe1)

  renderScene()
  animate()
}

function rotateObj (obj, angleVel) {
  obj.rotation.x += degreeToRadian(angleVel)
  obj.rotation.y += degreeToRadian(angleVel)
  // obj.rotation.z += degreeToRadian(angleVel)
}

function animate () {
  animationId = requestAnimationFrame(animate)

  rotateObj(lathe1, 0.5)

  renderScene()
}

function configureRendererAndCamera () {
  const pixelRatio = window.devicePixelRatio || 1
  const { width, height, clientWidth, clientHeight } = renderer.domElement
  const [desiredWidth, desiredHeight] = [clientWidth*pixelRatio, clientHeight*pixelRatio]
  const aspectRatio = clientWidth / clientHeight

  if (width !== desiredWidth || height !== desiredHeight)
    renderer.setSize(desiredWidth, desiredHeight, false)

  if (camera.aspect !== aspectRatio) {
    camera.aspect = aspectRatio
    camera.updateProjectionMatrix()
  }
}

function setupEventListeners () {
  window.addEventListener('resize', onWindowResize)
}

function onWindowResize () {
  configureRendererAndCamera()
  renderScene()
}

export {
  initThree
}