import * as THREE from 'three'
import { loadFont, OrbitControls } from '@three-util'
import { degreeToRadian, randomSign } from '@view-util'
import { Smoke, Building, Town, Car, LazorCars, Plane } from './city-3d-classes.js'

const {
  WebGLRenderer, Scene, PerspectiveCamera, Fog,
  Object3D, Vector3, Mesh, Group, Color,
  AmbientLight, SpotLight, SpotLightHelper, DirectionalLight, PointLight,
  BoxGeometry, CircleGeometry,
  MeshStandardMaterial, MeshLambertMaterial, MeshToonMaterial
} = THREE
const cameraSettings = {
  fov: 20, near: 1, far: 500,
  position: new Vector3(50, 50, 50), // new Vector3(0, 2, 14),
  lookAt: [0, 0, 0]
}
const colors = {
  bg: '#F02050',
  fog: '#F02050',
  building: '#000000',
  wire: '#FFFFFF',
  beam: '#FFFF00',
  gridLine: '#000000',
  ambientLight: '#FFFFFF',
  smoke: '#FFFF00'
}
const [BUILDING_HEIGHT_MAX, TOWN_RANGE] = [6, 5]

let renderer, scene, camera, grid, orbitControl
let city, town, smoke, building, car, cars, plane
let ambientLight, spotLight, pointLight
let animationid = null
const renderScene = () => renderer.render(scene, camera)

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true })
  renderer.setClearColor(colors.bg, 1)
  renderer.shadowMap.enabled = true

  scene = new Scene()
  scene.fog = new Fog(colors.fog, 15, 30)

  // define camera
  {
    const { fov, near, far, position, lookAt } = cameraSettings

    camera = new PerspectiveCamera(fov, 1, near, far)
    camera.position.copy(position)
    camera.lookAt(...lookAt)

    orbitControl = new OrbitControls(camera, canvasEl)
    orbitControl.screenSpacePanning = true
    orbitControl.update()
  }

  configureRendererAndCamera()
  setupEventListeners()

  // create city & objects
  {
    city = new Group()
    scene.add(city)

    // town
    town = new Town({
      rangeLength: TOWN_RANGE,
      buildingAmount: 25,
      sideLength: 1,
      heightMin: 1, heightMax: BUILDING_HEIGHT_MAX,
      segments: 2, color: colors.building
    })
    city.add(town)

    // smoke
    smoke = new Smoke({
      distance: 20, amount: 200, color: colors.smoke,
      particleRadius: 0.025,
      rotationSpeed: degreeToRadian(0.3)
    })

    city.add(smoke)

    // cars
    cars = new LazorCars({
      travelDistance: 40, carLength: 2,
      yMax: BUILDING_HEIGHT_MAX, 
      xzRange: TOWN_RANGE, carAmount: 35
    })

    city.add(cars)

    // grid
    plane = new Plane({ size: 60, color: colors.gridLine, gridMiddleColor: colors.bg })

    city.add(plane)

    // lights
    const [spotPos, spotShadowSize] = [BUILDING_HEIGHT_MAX * 1.25, 3000]

    ambientLight = new AmbientLight(colors.ambientLight, 4)
    spotLight = new SpotLight(colors.ambientLight, 50, 20)
    pointLight = new PointLight(colors.ambientLight, 0.5)
    
    spotLight.position.set(spotPos, spotPos, spotPos)
    spotLight.target.position.set(0, BUILDING_HEIGHT_MAX, 0)

    spotLight.castShadow = true
    spotLight.shadow.mapSize.width = spotLight.shadow.mapSize.height = spotShadowSize 
    spotLight.penumbra = 0.1

    pointLight.position.set(0, BUILDING_HEIGHT_MAX * 1.1, 0)

    scene.add(ambientLight, pointLight)
    scene.add(spotLight)
    scene.add(spotLight.target)
    // scene.add(new SpotLightHelper(spotLight))
  }

  renderScene()
  animate()
}

// helpers

function animate () {
  animationid = window.requestAnimationFrame(animate)

  // const time = Date.now() * 0.00005
  // const { x: cx, y: cy } = camera.rotation

  // city.rotation.x -= -1 * cx * uSpeed;
  // city.rotation.y -= -1 * cy * uSpeed;

  // if (city.rotation.x < -0.05)
  //   city.rotation.x = -0.05
  // else if (city.rotation.x > 1)
  //   city.rotation.x = 1;

  smoke.update()
  cars.update()
  renderScene()
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

function randomFloat (v, round = false) {
  const randomVal = randomSign() * v * Math.random()
  return round ? Math.round(randomVal) : randomVal
}

export { initThree }