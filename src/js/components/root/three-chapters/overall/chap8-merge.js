import * as THREE from 'three'
import { Axes, PlaneXY,
  getGeometryBoundingBox, CombineWithEdge,
  OrbitControls } from './utils.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

import { degreeToRadian, randomSign } from '@view-util'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector3, Color, Group, Mesh, Object3D,
  BufferGeometry, PlaneGeometry, ConeGeometry,
  MeshLambertMaterial, MeshStandardMaterial, LineBasicMaterial,
  CameraHelper,
  AmbientLight, DirectionalLight, EdgesGeometry,
  LineSegments,
  
} = THREE

let renderer, scene, camera, orbitControl
let ambientLight, directionalLight
let axes, plane, planeDash, cone
let exporter
let animationId = null

const renderScene = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [80, 80]
const cameraSettings = {
  fov: 75, near: 0.1, far: 1000,
  position: new Vector3(
    planeWidth * 1.1, 80, planeHeight * 1.1
  ),
  lookAt: [planeWidth * 0.4, 0.1, planeHeight * 0.4]
}
const colors = {
  bg: '#FFFFFF',
  ambientLight: '#DDDDDD',
  light: '#FFFFFF',
  line: '#6A6A6A',
  plane: '#3C5659',
  cone: '#F24405',
  objects: ['#F2059F', '#F2E205', '#F24405', '#418FBF', '#D9ADD2', '#AD24BF', '#F2C063']
}
const CONE_AMOUNT = 50

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({
    canvas: canvasEl, antialia: true })
  scene = new Scene()

  renderer.setClearColor(new Color (colors.bg))
  renderer.shadowMap.enabled = true

  // camera
  {
    const { fov, near, far, position, lookAt } = cameraSettings

    camera = new PerspectiveCamera(fov, 1, near, far)
    camera.position.copy(position)
    camera.lookAt(...lookAt)
  }

  configureRendererAndCamera()
  setupEventListeners()

  // lights
  {
    ambientLight = new AmbientLight(colors.ambientLight)
    directionalLight = new DirectionalLight(colors.light, 1)

    directionalLight.position.set(-1 * planeWidth/2, 40, planeHeight/2)
    directionalLight.target = new Object3D()
    directionalLight.target.position.set(planeWidth/2, 0.1, planeHeight/2)
    directionalLight.castShadow = true

    directionalLight.shadow.camera.left = -100
    directionalLight.shadow.camera.right = 100
    directionalLight.shadow.camera.top = 100
    directionalLight.shadow.camera.bottom = -100

    scene.add(ambientLight)
    scene.add(directionalLight, directionalLight.target)
  }

  // axes & plane
  {
    axes = new Axes({
      color: colors.line,
      size: Math.max(planeWidth, planeHeight) * 1.2
    })

    planeDash = new PlaneXY({
      color: colors.line, 
      width: planeWidth,
      height: planeHeight,
    })
    planeDash.rotation.x = -0.5 * Math.PI
    planeDash.position.set(0, 0.1, planeHeight)

    plane = new Mesh(
      new PlaneGeometry(planeWidth, planeHeight),
      new MeshStandardMaterial({ color: colors.plane,
        side: THREE.DoubleSide, transparent: true, opacity: 1 })
    )
    plane.rotation.x = -0.5 * Math.PI
    plane.position.set(planeWidth/2, 0, planeHeight/2)
    plane.receiveShadow = true

    scene.add(axes, planeDash, plane)
  }

  // objects
  {
    const randomFromArr = arr => arr[Math.floor(arr.length * Math.random())]
    const CONE_RADIUS = 6
    const CONE_GROUP_RADIUS = planeWidth / 2 * 0.85

    const coneGroup = new Group()
    const geometry = new ConeGeometry(CONE_RADIUS, CONE_RADIUS * 1.2, 4, 1)
    const coneLineMaterial = new LineBasicMaterial({ color: '#000000' })
    const coneLineGeometry = new EdgesGeometry(geometry)
    const { height: coneHeight } = getGeometryBoundingBox(geometry) 

    for (let i=0; i<CONE_AMOUNT; i++) {
      const material = new MeshStandardMaterial({
        color: randomFromArr(colors.objects),
        transparent: true, opacity: 1, side: THREE.DoubleSide
      })
      const cone = new Group()
      const coneSolid = new Mesh(geometry, material)
      const coneLine = new LineSegments(coneLineGeometry, coneLineMaterial)

      coneSolid.castShadow = true
      cone.add(coneSolid, coneLine)

      cone.rotation.y = Math.PI * 0.25
      cone.position.y += coneHeight / 2

      cone.position.x = randomSign() * Math.random() * CONE_GROUP_RADIUS
      cone.position.z = randomSign() * Math.random() * CONE_GROUP_RADIUS

      coneGroup.add(cone)
    }

    coneGroup.position.set(planeWidth/2, 0, planeHeight/2)
    scene.add(coneGroup)
  }

  { // exporter
    const aTag = document.createElement('a')
    aTag.classList.add('invisible-a-tag')
    canvasEl.parentNode.appendChild(aTag)

    exporter = new GLTFExporter()

    exporter.parse(scene,
      result => {
        console.log('export result: ', result)

        const outputStr = JSON.stringify(result)
        saveString(aTag, outputStr, 'example.json')
      })
      err => {
        console.log('export failed: ', err)
      }
  }

  renderScene()
  animate()
}

// helper funcs

function animate () {
  animationId = window.requestAnimationFrame(animate)

  renderScene()
}

function configureRendererAndCamera () {
  const pixelRatio = window.devicePixelRatio || 1
  const { width, height, clientWidth, clientHeight } = renderer.domElement
  const [desiredWidth, desiredHeight] = [
    pixelRatio * clientWidth, pixelRatio * clientHeight]
  const aspectRatio = clientWidth / clientHeight

  if (width !== desiredWidth || height !== desiredHeight)
    renderer.setSize(desiredWidth, desiredHeight, false)

  if (camera.aspect !== aspectRatio) {
    camera.aspect = aspectRatio

    camera.updateProjectionMatrix()
  }

  if (orbitControl)
    orbitControl.update()
}

function onWindowResize () {
  configureRendererAndCamera()
  renderScene()
}

function setupEventListeners () {
  window.addEventListener('resize', onWindowResize)
}

function cleanupThree () {
  window.removeEventListener('resize', onWindowResize)
}

function saveString (aTag, string, filename) {
  const blob = new Blob([string], { type: 'application/json' }, filename)

  const url = URL.createObjectURL(blob)
  aTag.href = url
  aTag.download = filename

  // aTag.click()
  // setTimeout(() => {
  //   URL.revokeObjectURL(url)
  // }, 1000)
}

export {
  initThree,
  cleanupThree
}