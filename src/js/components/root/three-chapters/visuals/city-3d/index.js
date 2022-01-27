import * as THREE from 'three'
import { loadFont, OrbitControls, Axes } from '@three-util'
import { degreeToRadian, randomSign } from '@view-util'
import { Smoke, Building, Town, Car } from './city-3d-classes.js'

const {
  WebGLRenderer, Scene, PerspectiveCamera, Fog,
  Object3D, Vector3, Mesh, Group, Color,
  AmbientLight, DirectionalLight,
  BoxGeometry, CircleGeometry,
  MeshStandardMaterial, MeshLambertMaterial, MeshToonMaterial,
  GridHelper
} = THREE
const cameraSettings = {
  fov: 20, near: 1, far: 500,
  position:  new Vector3(25, 25, 25), // new Vector3(0, 2, 14),
  lookAt: [0, 0, 0]
}
const colors = {
  bg: '#F02050',
  fog: '#F02050',
  building: '#000000',
  wire: '#FFFFFF',
  beam: '#FFFF00',
  gridMiddle: '#FF0000',
  gridLine: '#000000',
  ambientLight: '#FFFFFF',
  smoke: '#FFFF00'
}
const [uSpeed] = [0.001]

let renderer, scene, camera, axes, grid
let city, town, smoke, building, car
let ambientLight
let animationid = null
const renderScene = () => renderer.render(scene, camera)

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true })
  renderer.setClearColor(colors.bg, 1)
  renderer.shadowMap.enabled = true

  scene = new Scene()
  // scene.fog = new Fog(colors.fog, 10, 16)

  // define camera
  {
    const { fov, near, far, position, lookAt } = cameraSettings

    camera = new PerspectiveCamera(fov, 1, near, far)
    camera.position.copy(position)
    camera.lookAt(...lookAt)
  }

  configureRendererAndCamera()
  setupEventListeners()

  // axe & plane
  {
    axes = new Axes({ color: '#FFFFFF', size: 100 })
    scene.add(axes)
  }

  // create city & objects
  {
    city = new Group()
    scene.add(city)

    // town
    town = new Town({
      rangeLength: 8,
      buildingAmount: 100,
      sideLength: 1,
      heightMin: 1, heightMax: 8,
      segments: 2, color: colors.building
    })
    city.add(town)

    // for (let i=0; i<buildingAmount; i++) {
    //   const geometry = new BoxGeometry(1, 1, 1, segment, segment, segment)
    //   const cube = new Mesh(geometry, buildingMaterial)
    //   const floor = new Mesh(geometry, buildingMaterial)

    //   cube.castShadow = true
    //   cube.receiveShadow = true

    //   cube.scale.y = randomVal()
    //   cube.scale.x = cube.scale.z = cubeWidth + randomFloat(1 - cubeWidth)
    //   cube.position.x = randomFloat(8, true)
    //   cube.position.z = randomFloat(8, true)

    //   floor.scale.y = 0.05;
    //   floor.position.set(
    //     cube.position.x, 0, cube.position.z
    //   )

    //   town.add(floor)
    //   town.add(cube)

    //   city.add(town)

    //   scene.add(city)
    // }

    // smoke
    smoke = new Smoke({
      distance: 20, amount: 150, color: colors.smoke,
      particleRadius: 0.03,
      rotationSpeed: degreeToRadian(0.3)
    })

    city.add(smoke)

    // car
    car = new Car({ distance: 40, length: 2 })
    city.add(car)

    // grid
    grid = new GridHelper(60, 120, colors.gridMiddle, colors.gridLine)
    city.add(grid)

    // lights
    ambientLight = new AmbientLight(colors.ambientLight, 4)

    scene.add(ambientLight)
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
  car.update()
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