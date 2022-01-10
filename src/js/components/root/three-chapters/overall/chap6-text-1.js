import * as THREE from 'three'
import { Axes, PlaneXY, CombineMaterial, getGeometryBoundingBox,
  loadFont, TextGeometry } from './utils.js'
import { degreeToRadian, randomSign } from '@view-util'
import fontJsonPath from '@assets/fonts/json/Passion_One_Regular.typeface.json'
import { Group } from 'three'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  PlaneGeometry, ShapeGeometry, ExtrudeGeometry, BufferGeometry,
  Mesh, MeshLambertMaterial, MeshBasicMaterial, LineBasicMaterial,
  AmbientLight, SpotLight, Vector3, Color, Object3D, Path, Shape, Line
} = THREE

let renderer, scene, camera
let ambientLight, spotLight
let axes, customPlane, plane, textObj, textGroup
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
  textGroup = new Group()

  const onFontLoad = font => {
    if (!font)
      return;

    const textGeo = new TextGeometry('Sebin', {
      font: font,
      size: 12,
      height: 2,
      bevelEnabled: false
    })

    const { height: textHeight, width: textWidth } = getGeometryBoundingBox(textGeo)

    textObj = new CombineMaterial(
      textGeo,
      [
        new MeshLambertMaterial({ 
          color: colors.objects[2],
          transparent: true, opacity: 0.75,
          side: THREE.DoubleSide
        })
      ], true
    )

    textObj.rotation.x = Math.PI * -0.5
    textObj.position.set(-textWidth/2, 0, textHeight/2)

    textGroup.add(textObj)
    textGroup.position.set(planeWidth/2, 8, planeHeight/2)
    
    scene.add(textGroup)
  }

  loadFont(fontJsonPath)
    .then(onFontLoad)
    .catch(err => console.error('font loading failed! : ', err))

  // render & animation
  renderScene()
  animate()
}

function animate () {
  animationId = window.requestAnimationFrame(animate)

  if (textObj)
    textGroup.rotation.y += degreeToRadian(0.4)

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
}

function onScreenResize () {
  configureRendererAndCamera()
  renderScene()
}


export {
  initThree
}