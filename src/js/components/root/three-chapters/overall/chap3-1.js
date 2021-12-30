import { WebGLRenderer, CanvasRenderer, Scene, Color,
  PerspectiveCamera, Mesh, PlaneGeometry,
  MeshLambertMaterial,
  AmbientLight, PointLight, DirectionalLight, RectAreaLight,
  HemisphereLight, SpotLight, Group,
  Object3D, Vector3, CameraHelper
} from 'three'
import { Axes, PlaneXY, Cube, Sphere } from './utils.js'
import { randomFromArray, randomIntFromRange, degreeToRadian } from '@view-util'
import * as dat from 'dat.gui'

let renderer, scene, camera, axes, plane, spotLightTarget
let animationRequestId = null
let ambientLight, pointLight, spotLight, directionalLight, hemisphereLight, rectLight

const render = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [60, 60]
const sphereGroups = []
const sphereAniSettings = {
  tStart: null, delay: 150,
  angleSpeed: degreeToRadian(3), amplitude: 7
}
const gui = {
  controller: null, panel: null
}

const colors = {
  objects: ['#F2059F', '#F2E205', '#F24405', '#418FBF'],
  line: '#BFBAB0',
  plane: '#7D6B7D',
  ambientLight: '#DDDDDD',
  pointLight: '#FFFFFF',
  spotLight: '#FFFFFF',
  directionalLight: '#FFFFFF'
}

function initThree (canvasEl) {
  renderer = new WebGLRenderer({ canvas: canvasEl })
  scene = new Scene()

  // camera
  const [fov, nearPlane, farPlane] = [fov, nearPlane, farPlane]
  camera = new PerspectiveCamera(fov, 1, nearPlane, farPlane)

  initRendererAndCamera()
  setupEventListeners()

  // axes & plane
  axes = new Axes({ color: colors.line, size: 100, dashed: true, width: 3 })

  const customPlane = new PlaneXY({ 
    color: colors.line, dashed: true,
    width: planeWidth, height: planeHeight })
  customPlane.rotation.x = -0.5 * Math.PI
  customPlane.position.z = planeHeight

  plane = new Mesh (
    new PlaneGeometry(planeWidth, planeHeight, 1, 1),
    new MeshLambertMaterial({ color: colors.plane, transparent: true, opacity: 0.285 })
  )
  plane.rotation.x = -0.5 * Math.PI
  plane.position.set(planeWidth/2, 0, planeHeight/2)
  plane.receiveShadow = true

  scene.add(plane)
  scene.add(axes)
  scene.add(customPlane)

  // lights
  ambientLight = new AmbientLight(colors.ambientLight)
  pointLight = new PointLight(colors.pointLight, 1, 200, 2)
  spotLight = new SpotLight(colors.spotLight, 1, 0, 5)
  hemisphereLight = new HemisphereLight('#FF0000', '#00FF00', 1)
  directionalLight = new DirectionalLight(colors.directionalLight, 1)
  rectLight = new RectAreaLight('#FF0000', 1, 20, 40)

  spotLight.position.set(planeWidth/2, 60, planeHeight/2)
  spotLight.target.position.set(planeWidth/2, 0.1, planeHeight/2)
  spotLight.castShadow = true
  
  pointLight.position.set(planeWidth/2, 12, planeHeight/2)
  pointLight.castShadow = true;
  pointLight.visible = false;

  directionalLight.castShadow = true
  directionalLight.position.set(-70, 90, 70)
  directionalLight.target.position.set(30, 0.1, 30)

  /* IMPORTANT: need to enlarge the shadow camera area to render the shadows properly */
  directionalLight.shadow.camera.left = -100
  directionalLight.shadow.camera.right = 100
  directionalLight.shadow.camera.top = 100
  directionalLight.shadow.camera.bottom = -100

  rectLight.position.set(-5, 5, 5)
  rectLight.lookAt(0,0,0)

  scene.add(ambientLight)

  // scene.add(pointLight)

  scene.add(spotLight)
  scene.add(spotLight.target) // IMPORTANT : To update the target of the spot-light

  // scene.add(directionalLight)
  // scene.add(directionalLight.target) // IMPORTANT : To update the target of the directional light

  // scene.add(hemisphereLight)

  scene.add(rectLight)

  // camera helper
  // scene.add(new CameraHelper(spotLight.shadow.camera))

  // add objects
  const [sphereRadius, objectGap] = [2, 2]
  const spherePositionArr = createGroups(4, 2)

  spherePositionArr.forEach((positions, groupIndex) => {
    
    const group = new Group()
    const colorArr = colors.objects
    const groupColor = colorArr[groupIndex % colorArr.length]
    const offset = sphereRadius*2 + objectGap

    positions.forEach(([x, y, z]) => {
      const sphere = new Sphere({ 
        radius: sphereRadius, color: groupColor,
        scene: scene
      })
      sphere.position.set(x * offset, y, z * offset)
      sphere.castShadow = true

      group.add(sphere)
      group.position.x = planeWidth/2
      group.position.z = planeHeight/2 
      group.theta = 0
    })

    sphereGroups.push(group)
    scene.add(group)
  })

  setupGUI()
  render()
  animate()
}

function animate () {
  animationRequestId = requestAnimationFrame(animate)

  const { delay, angleSpeed, amplitude } = sphereAniSettings
  const tNow = Date.now()
  if (!sphereAniSettings.tStart)
    sphereAniSettings.tStart = tNow;
  
  const tGap = tNow - sphereAniSettings.tStart;
  sphereGroups.forEach((group, index) => {
    const delayToApply = delay * index

    if (tGap <= delayToApply)
      return

    group.theta += angleSpeed

    const yChange = amplitude * Math.abs(Math.sin(group.theta))
    group.position.y = yChange
  })

  render()
}

function setupGUI () {
  const panel = new dat.GUI()
  const controller = {
    ambientColor: colors.ambientLight,
    pointLightIntensity: 1
  }

  panel.addColor(controller, 'ambientColor').onChange(val => {
    ambientLight.color.set(val)
  })
  panel.add(controller, 'pointLightIntensity', 0.1, 4, 0.05).onChange(val => {
    pointLight.intensity = val
  })

  gui.panel = panel
  gui.controller = controller
}

function initRendererAndCamera () {
  const pixelRatio = window.devicePixelRatio || 1
  const { clientWidth, clientHeight, width, height } = renderer.domElement
  const [ desiredWidth, desiredHeight ] = [ clientWidth * pixelRatio, clientHeight * pixelRatio ]
  const aspectRatio = desiredWidth / desiredHeight

  if (width !== desiredWidth || height !== desiredHeight)
    renderer.setSize(desiredWidth, desiredHeight, false)

  renderer.shadowMap.enabled = true
  renderer.setClearColor('#FFFFFF')

  camera.aspect = aspectRatio
  camera.updateProjectionMatrix()

  camera.position.set(90, 40, 90)
  camera.lookAt(0,0,0)
  // camera.position.set(70, 90, 70)
  // camera.lookAt(planeWidth/2, 0, planeHeight/2)
}

function setupEventListeners () {
  window.addEventListener('resize', onScreenResize)
}

function onScreenResize () {
  initRendererAndCamera()
  render()
}

// helpers
function createGroups (line = 0, y = 0) {
  const groupArr = [ [[0, y, 0]] ]
  const range = (a, b) => {
    const arr = []
    
    while (a <= b) { arr.push(a++) }
    return arr
  }
  
  if (line < 1)
    return groupArr
  
  for (let i=1; i<=line; i++) {
    const rangeArr = range(i*-1, i)
    const arrToAdd = [
      ...rangeArr.map(num => [-i, y, num]),
      ...rangeArr.map(num => [i, y, num]),
      ...rangeArr.map(num => [num, y, i]).filter(dot => Math.abs(dot[0]) < i),
      ...rangeArr.map(num => [num, y, -i]).filter(dot => Math.abs(dot[0]) < i)
    ]
    groupArr.push(arrToAdd)
  }
  
  return groupArr
}


export {
  initThree
}