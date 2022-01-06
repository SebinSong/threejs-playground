import * as THREE from 'three'
import { Axes, PlaneXY, CombineMaterial,
  getGeometryBoundingBox } from './utils.js'
import { degreeToRadian } from '@view-util'
import { PolyhedronBufferGeometry } from 'three'

const { 
  WebGLRenderer, Scene, PerspectiveCamera,
  Color, Vector2, Vector3, Object3D, Mesh, 
  PlaneGeometry, BoxGeometry, SphereGeometry, CylinderGeometry, TorusGeometry,
  PolyhedronGeometry, IcosahedronBufferGeometry, TetrahedronGeometry,

  MeshLambertMaterial, MeshBasicMaterial, MeshNormalMaterial,
  AmbientLight, SpotLight, PointLight,
  CameraHelper, Shape, Line, BufferGeometry, Path
} = THREE

let renderer, scene, camera, ambientLight, spotLight, pointLight, cameraHelper
let animationRequestId
let axes, customPlane, plane, cylinder, torus

let cube, sphere, polyhedron, tetrahedron

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
  objects: ['#F2059F', '#F2E205', '#F24405', '#418FBF', '#D9ADD2', '#AD24BF', '#F2C063'],
  line: '#BFBAB0',
  plane: '#FFFFFF',
  light: '#FFFFFF',
  ambientLight: '#888888',
  pointLight: '#FFFFFF'
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
      color: colors.plane, transparent: true, opacity: 0.7,
      side: THREE.DoubleSide
    })
  )
  plane.rotation.x = -0.5 * Math.PI
  plane.position.set(planeWidth/2, 0, planeHeight/2)
  plane.receiveShadow = true

  scene.add(customPlane)
  scene.add(axes)
  // scene.add(plane)

  // lights
  ambientLight = new AmbientLight(colors.ambientLight)
  spotLight = new SpotLight(colors.light, 1.5)
  pointLight = new PointLight(colors.pointLight, 2)

  spotLight.position.set(planeWidth/2, 100, planeHeight/2)
  spotLight.target = new Object3D()
  spotLight.target.position.set(planeWidth/2, 0.1, planeHeight/2)
  spotLight.castShadow = true

  pointLight.position.set(16, 12, 22)
  pointLight.castShadow = true

  cameraHelper = new CameraHelper(spotLight.shadow.camera)

  scene.add(ambientLight)
  scene.add(spotLight)
  scene.add(spotLight.target)

  const materialArr = [
    new MeshLambertMaterial({ color: colors.objects[0] }),
    new MeshLambertMaterial({ color: colors.objects[1] }),
    new MeshLambertMaterial({ color: colors.objects[2] }),
    new MeshLambertMaterial({ color: colors.objects[3] }),
    new MeshLambertMaterial({ color: colors.objects[0] }),
    new MeshLambertMaterial({ color: colors.objects[1] })
  ]
  // objects
  cube = new Mesh(
    new BoxGeometry(3,3,3,2,2,2),
    materialArr
  )
  cube.position.set(3, 2, 3)
  cube.castShadow = true

  const cubeClone = cube.clone()
  cubeClone.material = new MeshBasicMaterial({ color: '#333333', wireframe: true })

  // sphere
  sphere = new CombineMaterial(
    new SphereGeometry(5, 16, 12, 0, Math.PI),
    [
      new MeshLambertMaterial({ color: colors.objects[2], transparent: true, 
        opacity: 0.5, side: THREE.DoubleSide  }),
      new MeshBasicMaterial({ color: '#000000', wireframe: true, opacity: 0.1, transparent: true })
    ], true
  )
  sphere.position.set(10, 12, 22)
  sphere.rotation.x = Math.PI * 0.5

  // cylinder
  cylinder = new CombineMaterial(
    new CylinderGeometry(3, 3, 12, 20, 3, false),
    [
      new MeshNormalMaterial({ side: THREE.DoubleSide }),
      // new MeshLambertMaterial({ color: colors.objects[5], transparent: true, opacity: 0.7,
      //   side: THREE.DoubleSide }),
      new MeshBasicMaterial({ color: '#000000', wireframe: true, opacity: 0.1, transparent: true  })
    ], true
  )
  cylinder.position.set(14, cylinder.geometry.parameters.height/2, 40)

  const [cylClone1, cylClone2] = [
    CombineMaterial.clone(cylinder), CombineMaterial.clone(cylinder)
  ]

  cylClone1.position.x += 10
  cylClone1.updateGeometry(new CylinderGeometry(0, 3, 12, 20, 3, false))

  cylClone2.position.x += 20
  cylClone2.updateGeometry(new CylinderGeometry(-3, 3, 12, 20, 3, false))

  // torus
  torus = new CombineMaterial(
    new TorusGeometry(5, 1.5, 16, 32, Math.PI),
    [
      new MeshLambertMaterial({ color: colors.objects[5], transparent: true,
        opacity: 0.7, side: THREE.DoubleSide }),
      new MeshBasicMaterial({ color: '#000000', transparent: true, 
        opacity: 0.1, wireframe: true  })
    ], true
  )

  // polyhedron

  polyhedron = new CombineMaterial(
    new IcosahedronBufferGeometry(3, 0),
    [
      new MeshLambertMaterial({ color: colors.objects[2], transparent: true, 
        opacity: 0.7, side: THREE.DoubleSide }),
      new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.4,
        wireframe: true, side: THREE.DoubleSide })
    ], true
  )

  polyhedron.position.set(16, 6, 10)
  polyhedron.castShadow = true

  // tetrahedron
  tetrahedron = new CombineMaterial(
    new TetrahedronGeometry(4, 0),
    [
      new MeshLambertMaterial({ color: colors.objects[3],
        transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
      new MeshBasicMaterial({ color: '#000000', transparent: true,
        opacity: 0.3, wireframe: true })
    ], true
  )

  tetrahedron.position.set(25, 6, 10)
  tetrahedron.castShadow = true

  scene.add(cube)
  scene.add(cubeClone)

  scene.add(sphere)

  scene.add(cylinder)
  scene.add(cylClone1)
  scene.add(cylClone2)

  scene.add(torus)
  scene.add(polyhedron)
  scene.add(tetrahedron)

  renderScene()
  animate()
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