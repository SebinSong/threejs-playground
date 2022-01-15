import * as THREE from 'three'
import { Axes, OutlineGeometry } from './visuals_utils.js'
import { degreeToRadian, randomFromArray, randomSign } from '@view-util'

const {
  WebGLRenderer, Scene, PerspectiveCamera,
  Vector2, Vector3, Group,
  PlaneGeometry, EdgesGeometry, CircleGeometry, SphereGeometry,
  LineSegments, Mesh, LineBasicMaterial, MeshBasicMaterial,
  AmbientLight
} = THREE

let renderer, scene, camera, orbitControl
let ambientLight
let axes, boundaryBox, ball, ball2
let animationId = null

const renderScene = () => renderer.render(scene, camera)
const [planeWidth, planeHeight] = [120, 120]
const cameraSettings = {
  fov: 75, near: 0.1, far: 1000,
  position: new Vector3(
    planeWidth * 1.2, 
    Math.max(planeWidth, planeHeight) * 1.4, 
    planeHeight * 1.2),
  lookAt: [planeWidth/2, 0.1, planeHeight/2]
}
const cameraAni = { yTheta: 0, theta: 0, 
  thetaSpeed: degreeToRadian(0.15), 
  yThetaSpeed: degreeToRadian(0.2) }
const mouse = { x: 0, y: 0 }
const colors = {
  bg: '#000000',
  obj: '#18FFFF',
  line: '#FFFFFF',
  light: '#FFFFFF'
}
const circles = []

class BoundaryBox extends Group {
  constructor ({ 
    width = 50, height = 50, depth = 50, color = colors.line,
    position = new Vector3(0, 0, 0)
  }) {
    super()

    const createPlane = (w, h) => {
      // important that these two are separate
      const planeGeometry = new PlaneGeometry(w, h)
      const edgeGeometry = new EdgesGeometry(new PlaneGeometry(w, h))

      const lineMaterial = new LineBasicMaterial({ color })
      const planeMaterial = new MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide })

      const group = new Group()

      group.add(new LineSegments(edgeGeometry, lineMaterial))
      group.add(new Mesh(planeGeometry, planeMaterial))
      group.material = planeMaterial

      return group
    }

    const [front, back, left, right, bottom] = [
      createPlane(width, depth),
      createPlane(width, depth),
      createPlane(height, depth),
      createPlane(height, depth),
      createPlane(width, height)
    ]

    bottom.rotation.x = Math.PI * -0.5
    front.position.set(0, depth/2, height/2)
    back.position.set(0, depth/2, -1 * height/2)
    
    left.rotation.y = Math.PI * -0.5
    left.position.set(-0.5 * width, 0.5 * depth, 0)

    right.rotation.y = Math.PI * 0.5
    right.position.set(0.5 * width, 0.5 * depth, 0)

    this.position.copy(position)

    this.faces = { front, back, left, right, bottom }
    this.dimensions = { width, height, depth }

    Object.entries(this.faces).forEach(([key, plane]) => {
      plane.name = key

      this.add(plane)
    })
  }
  
  update () {
    Object.values(this.faces).forEach(plane => {
      const currOpacity = plane.material.opacity

      if (currOpacity > 0)
        plane.material.opacity = currOpacity - 0.01 > 0 ? currOpacity - 0.01 : 0
    })
  }
}

class AniCircle extends OutlineGeometry {
  constructor (color = "#ffffff",
    dirVector = new Vector3(0,0,1),
    position = new Vector3(0,0,0)) {
    const settings = { 
      radius: 0.75, segments: 32, 
      currentScale: 1, currentOpacity: 1,
      scaleIncrement: 0.147, opacityDecrement: 0.008
    }
    const geometry = new CircleGeometry(settings.radius, 32)

    super(geometry, color)

    const { x, y, z } = dirVector
    this.lookAt(x, y, z)
    this.position.copy(position)

    this.circleGeometry = geometry
    this.settings = settings
    this.color = color
    this.aniFinished = false
  }

  update () {
    if (this.aniFinished)
      return

    const { opacityDecrement, scaleIncrement } = this.settings

    const scaleValue = (this.settings.currentScale += scaleIncrement)
    const opacityValue = (this.settings.currentOpacity -= opacityDecrement)

    if (this.settings.currentOpacity <= 0)
      this.aniFinished = true
    else {
      this.scale.set(scaleValue, scaleValue, scaleValue)
      this.material.opacity = opacityValue
    }
  }

  remove () { 
    if (this.parent) this.parent.remove(this);
  }
}

class Ball extends OutlineGeometry {
  constructor ({ 
    radius = 2, color = "#FFFFFF", initPosition = new Vector3(30, 30, 30),
    velocity = {x: 0.8, z: 0.8}, // x & z
    boundaryBox = null,
    createCircleWave = () => {} // func
  }) {
    const geometry = new SphereGeometry(radius, 10, 10)

    super(geometry, color)

    this.position.copy(initPosition)
    this.radius = radius

    this.velocity = velocity
    this.rotationSpeed = degreeToRadian(-5)
    this.calcRotationAxis()

    this.boundaryBox = boundaryBox
    this.yVel = 0 // treat this separately as it's under the influence of gravity
    this.gravityAccel = 0.3

    const axisArr = [ new Vector3(1,0,0), new Vector3(0,1,0), new Vector3(0,0,1), new Vector3(0,-1,0)]
    
    this.rotateAxis = randomFromArray(axisArr)
    this.rotateAngleSpeed = degreeToRadian(0.9)

    this.createCircleWave = createCircleWave
  }

  calcRotationAxis () {
    // rotation of 2D vector reference: https://matthew-brett.github.io/teaching/rotation_2d.html

    const {x, z} = this.velocity
    const theta = Math.PI * 0.5

    this.rotationAxis = new Vector3(
      x * Math.cos(theta) - z * Math.sin(theta),
      0,
      x * Math.sin(theta) + z * Math.cos(theta)
    ).normalize()
  }

  update () {
    // velocity update
    this.yVel += -1 * this.gravityAccel

    // position update
    this.position.x += this.velocity.x
    this.position.z += this.velocity.z
    this.position.y += this.yVel

    this.checkIfEdges()

    this.rotateOnAxis(this.rotationAxis, this.rotationSpeed)
  }

  checkIfEdges () {
    if (!this.boundaryBox)
      return

    const { x, y, z } = this.position
    const { x: bx, y: by, z: bz } = this.boundaryBox.position
    const { width: bw, height: bh } = this.boundaryBox.dimensions
    const lightPlane = name => this.boundaryBox.faces[name].material.opacity = 0.7

    // check if the ball hits the 'bottom' of the box
    if (y <= this.radius) {
      this.position.y = this.radius
      this.yVel *= -1

      if (this.yVel > 0 && this.yVel < 4.25)
        this.yVel = 4.25

      this.createCircleWave('bottom', new Vector3(x, 0, z))
    }

    const [ frontz, backz, leftx, rightx ] = [
      bz + bh/2,
      bz - bh/2,
      bx - bw/2,
      bx + bw/2
    ]

    // check 'front' plane
    if (z + this.radius >= frontz) {
      this.position.z = frontz - this.radius
      this.velocity.z *= -1

      lightPlane('front')
    }

    // check 'back' plane
    if (z - this.radius <= backz) {
      this.position.z = backz + this.radius
      this.velocity.z *= -1

      lightPlane('back')
    }

    // check 'left' plane
    if (x - this.radius <= leftx) {
      this.position.x = leftx + this.radius
      this.velocity.x *= -1

      lightPlane('left')
    }

    // check 'right' plane
    if (x + this.radius >= rightx) {
      this.position.x = rightx - this.radius
      this.velocity.x *= -1

      lightPlane('right')
    }

    this.calcRotationAxis()
  }
}

function initThree (canvasEl) {
  // renderer & scene
  renderer = new WebGLRenderer({
    canvas: canvasEl, alpha: true, antialias: true
  })
  renderer.setPixelRatio(window.devicePixelRatio || 1)
  renderer.setClearColor(colors.bg, 1)
  scene = new Scene()

  // camera
  {
    const { fov, near, far,
      position, lookAt } = cameraSettings

    camera = new PerspectiveCamera(fov, 1, near, far)
    camera.position.copy(position)
    camera.lookAt(...lookAt)
  }

  configureRendererAndCamera()
  setupEventListeners()

  // light
  ambientLight = new AmbientLight(colors.light)
  scene.add(ambientLight)

  // axes & planes
  axes = new Axes({ color: colors.line, size: 200 })

  // scene.add(axes)

  // objects
  {
    const boxD = { width: planeWidth, height: planeHeight, depth: 100 }
    boundaryBox = new BoundaryBox({ 
      width: boxD.width, height: boxD.height, depth: boxD.depth, 
      color: colors.obj, position: new Vector3(boxD.width/2, 0, boxD.height/2) })

    scene.add(boundaryBox)

    // ball
    const genCricleWave = (plane, pos) => {
      const dirVectorMap = {
        'bottom': new Vector3(0, -1, 0),
        'front': new Vector3(0, 0, 1),
        'back': new Vector3(0, 0, -1),
        'left': new Vector3(-1, 0, 0),
        'right': new Vector3(1, 0, 0)
      }

      const dirVector = dirVectorMap[plane]
      const circle = new AniCircle(colors.obj, dirVector, pos)

      circles.push(circle)
      scene.add(circle)
    }

    const randomInitPos = () => new Vector3(
      boxD.width/2 + randomSign() * 20,
      boxD.depth * (0.65 + Math.random() * 0.25),
      boxD.height/2 + randomSign() * 20,
    )
    ball = new Ball({ 
      radius: 8, color: colors.obj,
      velocity: {x: 0.7, z: 0.5 }, 
      initPosition: randomInitPos(),
      boundaryBox,
      createCircleWave: genCricleWave
    })

    ball2 = new Ball({ 
      radius: 8, color: colors.obj,
      velocity: {x: -0.85, z: -0.7 }, 
      initPosition: randomInitPos(),
      boundaryBox,
      createCircleWave: genCricleWave
    })

    scene.add(ball)
    scene.add(ball2)
  }

  renderScene()
  animate()
}

function animate () {
  animationId = requestAnimationFrame(animate)

  const len = circles.length
  for (let i=len - 1; i >= 0; i--) {
    const currentCircle = circles[i]

    if (currentCircle.aniFinished) {
      currentCircle.remove()
      circles.splice(i, 1)

      continue
    }

    currentCircle.update()
  }

  // ball
  ball.update()
  ball2.update()

  // boundaryBox
  boundaryBox.update()

  // camera
  animateCamera()

  renderScene()
}

function animateCamera () {
  const rotationCenter = { x: planeWidth/2, z: planeHeight/2 }
  const r = planeWidth

  cameraAni.theta += degreeToRadian(0.175)
  cameraAni.yTheta += degreeToRadian(0.85)

  const [x, y, z] = [
    rotationCenter.x + r * Math.cos(cameraAni.theta),
    cameraSettings.position.y + Math.sin(cameraAni.yTheta) * 20,
    rotationCenter.z + r * Math.sin(cameraAni.theta)
  ]

  camera.position.set(x, y, z)
  camera.lookAt(...cameraSettings.lookAt)
  camera.updateProjectionMatrix()
}

function configureRendererAndCamera () {
  const { width, height, clientWidth, clientHeight } = renderer.domElement
  const aspectRatio = clientWidth / clientHeight

  if (width !== clientWidth || height !== clientHeight) {
    renderer.setSize(clientWidth, clientHeight, false)

    mouse.x = clientWidth / 2
    mouse.y = clientHeight / 2
  }

  if (camera.aspect !== aspectRatio) {
    camera.aspect = aspectRatio

    camera.updateProjectionMatrix()
  }

  if (orbitControl)
    orbitControl.update()
}

function onScreenResize () {
  configureRendererAndCamera()
  renderScene()
}

function setupEventListeners () {
  window.addEventListener('resize', onScreenResize)

  renderer.domElement.addEventListener('mousemove', e => {
    mouse.x = e.clientX
    mouse.y = e.clientY
  })
}

export { initThree }