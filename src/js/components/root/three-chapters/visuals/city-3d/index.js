import * as THREE from 'three'
import { loadFont, OrbitControls } from '@three-util'
import { degreeToRadian, randomSign, signOf } from '@view-util'
import { Smoke, Building, Town, Car, LazorCars, Plane } from './city-3d-classes.js'

const {
  WebGLRenderer, Scene, PerspectiveCamera, Fog,
  Object3D, Vector2, Vector3, Mesh, Group, Color,
  AmbientLight, SpotLight, DirectionalLight, PointLight,
  BoxGeometry, CircleGeometry,
  MeshStandardMaterial, MeshLambertMaterial, MeshToonMaterial
} = THREE

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
const mouse = new Vector2(0, 0)
const [BUILDING_HEIGHT_MAX, TOWN_RANGE] = [4, 5]
const cameraSettings = {
  fov: 20, near: 1, far: 500,
  position: new Vector3(
    TOWN_RANGE * 2.25,
    BUILDING_HEIGHT_MAX * 3,
    TOWN_RANGE * 2.25), // new Vector3(0, 2, 14),
  lookAt: [0, 0, 0]// [0, 0, 0]
}

let renderer, scene, camera, grid, orbitControl
let city, town, smoke, building, car, cars, plane
let ambientLight, spotLight, pointLight
let theta = 0
let animationid = null
const renderScene = () => renderer.render(scene, camera)

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true })
  renderer.setClearColor(colors.bg, 1)
  renderer.shadowMap.enabled = true

  scene = new Scene()
  scene.fog = new Fog(colors.fog, 8, 30)

  // define camera
  {
    const { fov, near, far, position, lookAt } = cameraSettings

    camera = new PerspectiveCamera(fov, 1, near, far)
    camera.position.copy(position)
    camera.lookAt(...lookAt)

    orbitControl = new OrbitControls(camera, canvasEl)
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
      distance: TOWN_RANGE * 1.2, amount: 300,
      color: colors.smoke,
      particleRadius: 0.0075,
      rotationSpeed: degreeToRadian(0.2)
    })

    city.add(smoke)

    // cars
    cars = new LazorCars({
      travelDistance: 30, carLength: 1.25,
      yMax: BUILDING_HEIGHT_MAX, 
      xzRange: TOWN_RANGE, carAmount: 50
    })

    city.add(cars)

    // grid
    plane = new Plane({ size: 60, color: colors.gridLine, gridMiddleColor: colors.bg })

    city.add(plane)

    // lights
    const [spotPos, spotShadowSize] = [BUILDING_HEIGHT_MAX * 1.25, 3000]

    ambientLight = new AmbientLight(colors.ambientLight, 4)
    spotLight = new SpotLight(colors.ambientLight, 20, 40)
    pointLight = new PointLight(colors.ambientLight, 0.85)
    
    spotLight.position.set(spotPos, spotPos * 1.75, spotPos)
    spotLight.target.position.set(-1 * TOWN_RANGE, 0, -1 * TOWN_RANGE)

    spotLight.castShadow = true
    spotLight.shadow.mapSize.width = spotLight.shadow.mapSize.height = spotShadowSize 
    spotLight.penumbra = 0.1

    pointLight.position.set(-1 * spotPos, BUILDING_HEIGHT_MAX * 0.8, -1 * spotPos)

    scene.add(ambientLight, pointLight)
    city.add(spotLight)
    city.add(spotLight.target)

  }

  renderScene()
  animate()
}

// helpers

function animate () {
  animationid = window.requestAnimationFrame(animate)

  // city rotation
  const rotationSign = { y: signOf(mouse.x), x: signOf(mouse.y) * -1 }
  
  city.rotation.y += (rotationSign.y * degreeToRadian(0.03) + mouse.x * 0.015) 
  city.rotation.x += (rotationSign.x * degreeToRadian(0.02) + mouse.y * 0.012)

  if (city.rotation.x >= 0.6)
    city.rotation.x = 0.6
  else if (city.rotation.x <= -0.4)
    city.rotation.x = -0.4

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

  // mousemove
  window.addEventListener('mousemove', ({ clientX, clientY }) => { 
    mouse.set(
      clientX / window.innerWidth - 0.5, 
      clientY / window.innerHeight - 0.5
    )
  })

  // touch events

}

function randomFloat (v, round = false) {
  const randomVal = randomSign() * v * Math.random()
  return round ? Math.round(randomVal) : randomVal
}

export { initThree }