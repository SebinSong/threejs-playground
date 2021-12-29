import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, PlaneGeometry, MeshLambertMaterial,
  AmbientLight, DirectionalLight, Object3D,
  Group, PCFSoftShadowMap
} from 'three'
import { Axes, PlaneXY, Sphere, DepthSphere } from './utils.js'
import { degreeToRadian } from '@view-util'
import * as dat from 'dat.gui'
let renderer, scene, camera, axes, plane
let animationRequestId = null
let ambientLight, directionalLight

const render = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [60, 60]
const sphereGroups = []
const sphereAniSettings = {
  tStart: null, delay: 150,
  angleSpeed: degreeToRadian(3), amplitude: 7
}
const gui = { controller: null, panel: null }

const colors = {
  objects: ['#F2059F', '#F2E205', '#F24405', '#418FBF'],
  line: '#BFBAB0',
  plane: '#7D6B7D',
  ambientLight: '#DDDDDD',
  directionalLight: '#FFFFFF'
}

function initThree (canvasEl) {
  renderer = new WebGLRenderer({ canvas: canvasEl })
  scene = new Scene()

  // camera
  const [fov, nearPlane, farPlane] = [45, 40, 500]
  camera = new PerspectiveCamera(fov, 1, nearPlane, farPlane)

  initRendererAndCamera()
  setupEventListeners()

  // axes & planes
  axes = new Axes({ color: colors.line, size: 100 })

  const customPlane = new PlaneXY({ 
    color: colors.line, width: planeWidth, height: planeHeight })
  customPlane.rotation.x = -0.5 * Math.PI
  customPlane.position.z = planeHeight

  plane = new Mesh(
    new PlaneGeometry(planeWidth, planeHeight, 1, 1),
    new MeshLambertMaterial({ 
      color: colors.plane, transparent: true,
      opacity: 0.45, side: 'double'
    })
  )
  plane.rotation.x = -0.5 * Math.PI
  plane.position.set(planeWidth/2, 0, planeHeight/2)
  plane.receiveShadow = true

  scene.add(customPlane)
  scene.add(axes)
  scene.add(plane)

  // lights
  ambientLight = new AmbientLight(colors.ambientLight)
  directionalLight = new DirectionalLight(colors.ambientLight, 1)

  const dirLightTarget = new Object3D()
  dirLightTarget.position.set(planeWidth/2, 0.1, planeHeight/2)

  directionalLight.castShadow = true
  directionalLight.position.set(-1 * planeWidth/2, 90, -1 * planeHeight/2)
  directionalLight.target = dirLightTarget 

  directionalLight.shadow.camera.left = -100
  directionalLight.shadow.camera.right = 100
  directionalLight.shadow.camera.top = 100
  directionalLight.shadow.camera.bottom = -100

  scene.add(ambientLight)
  scene.add(directionalLight)
  scene.add(directionalLight.target)

  // add objects
  const [sphereRadius, objectGap] = [2, 2]
  const spherePositionArr = createGroups(4, sphereRadius)

  spherePositionArr.forEach((positions, groupIndex) => {
    const group = new Group()
    const colorArr = colors.objects
    const groupColor = colorArr[groupIndex % colorArr.length]
    const offset = sphereRadius * 2 + objectGap

    positions.forEach(([x, y, z]) => {
      const sphere = new DepthSphere ({
        radius: sphereRadius, color: groupColor,
        scene: scene
      })

      sphere.position.set(x*offset, y, z*offset)
      sphere.castShadow = true

      group.add(sphere)
      group.position.x = planeWidth / 2
      group.position.z = planeHeight / 2
      group.theta = 0
    })

    sphereGroups.push(group)
    scene.add(group)
  })

  // camera helper
  // scene.add(new CameraHelper(directionalLight.shadow.camera))

  render()
  animate()
}

function animate () {
  animationRequestId = requestAnimationFrame(animate)

  const { delay, angleSpeed, amplitude } = sphereAniSettings
  const tNow = Date.now()

  if (!sphereAniSettings.tStart)
    sphereAniSettings.tStart = tNow

    const tGap = tNow - sphereAniSettings.tStart
    sphereGroups.forEach((group, index) => {
    const delayToApply = delay * index

    if (tGap <= delayToApply) return

    group.theta += angleSpeed
    const yChange = amplitude * Math.abs(Math.sin(group.theta))
    group.position.y = yChange
  })

  render()
}

function initRendererAndCamera () {
  const pixelRatio = window.devicePixelRatio || 1
  const { width, height, clientHeight, clientWidth } = renderer.domElement
  const [desiredWidth, desiredHeight] = [clientWidth * pixelRatio, clientHeight * pixelRatio]
  const aspectRatio = clientWidth / clientHeight

  if (desiredWidth !== width || desiredHeight !== height)
    renderer.setSize(desiredWidth, desiredHeight, false)

  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFSoftShadowMap
  renderer.setClearColor('#FFFFFF')

  camera.aspect = aspectRatio
  camera.updateProjectionMatrix()
  camera.position.set(70, 50, 70)
  camera.lookAt(planeWidth/2, 1, planeHeight/2)
}

function setupEventListeners () {
  window.addEventListener('resize', onScreenResize)
}

function onScreenResize () {
  initRendererAndCamera()
  render()
}

// helper funcs
function createGroups (line = 0, y = 0) {
  const groupArr = [ 
    [ [0, y, 0] ]
  ]
  const range = (a,b) => {
    const arr = []

    while (a <= b) { arr.push(a++) }
    return arr
  }

  if (line < 1)
    return groupArr

  for (let i=1; i<line; i++) {
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