import {
  WebGLRenderer, AxesHelper,
  Scene, PerspectiveCamera,
  PlaneGeometry, Mesh,
  MeshBasicMaterial,
  BoxGeometry, SphereGeometry,
  SpotLight, MeshLambertMaterial
} from 'three'

const colors = {
  plane: 0x365073,
  cube: 0x9B8ABF,
  sphere: 0xD99282
}
let renderer, scene, camera, axes, plane, cube, sphere, light
let aniId = null
const render = () => renderer.render(scene, camera)

function initThree (canvasEl) {
  // create scene
  scene = new Scene()

  // create camera
  const [ fov, nearPlane, farPlane ] = [ 45, 0.1, 1000]
  camera = new PerspectiveCamera(fov, 1, nearPlane, farPlane)

  // renderer
  renderer = new WebGLRenderer({ canvas: canvasEl })
  initRendererAndCamera()
  setUpEventListeners()

  
  // axes
  axes = new AxesHelper(20)
  scene.add(axes)

 
  // plane
  const [ planeW, planeH ] = [ 60, 20 ]
  plane = new Mesh(
    new PlaneGeometry(planeW, planeH, 1, 1),
    new MeshLambertMaterial({ color: colors.plane })
  )
  plane.position.set(planeW/2, 0, 0)
  plane.rotation.x = -0.5 * Math.PI
  plane.receiveShadow = true;
  scene.add(plane)


  // cube
  cube = new Mesh(
    new BoxGeometry(4, 4, 4),
    new MeshLambertMaterial({ color: colors.cube })
  )
  cube.position.set(2, 2, 0)
  cube.castShadow = true;
  scene.add(cube)


  // sphere
  sphere = new Mesh(
    new SphereGeometry(2, 20, 20),
    new MeshLambertMaterial({ color: colors.sphere })
  )
  sphere.position.set(14, 2, 0)
  sphere.castShadow = true;
  scene.add(sphere)

  // light
  light = new SpotLight(0xFFFFFF)
  light.position.set(-20, 40, -20)
  light.castShadow = true

  scene.add(light)

  // camera position
  // camera.position.set(0, 10, 30)
  // camera.lookAt(0, 10, 0)
  camera.position.set(20, 20, 20)
  camera.lookAt(0, 0, 0)


  render()
  animate()

  let stepX = 0, stepY = 0
  function animate () {
    aniId = requestAnimationFrame(animate)

    stepX += 0.02
    stepY += 0.08

    // sphere position (14, 2, 0)
    sphere.position.x = 14 + Math.sin(stepX) * 3
    sphere.position.y = 2 + Math.abs(Math.cos(stepY) * 3)

    cube.rotation.x += 0.015
    cube.rotation.y += 0.015

    render()
  }
}


// common
function degreeToRadian (deg) {
  return deg / 180 * Math.PI
}

function setUpEventListeners () {
  window.addEventListener('resize', initRendererAndCamera)
}

function initRendererAndCamera() {
  const pixelRatio = window.devicePixelRatio || 1
  const el = renderer.domElement
  const { clientHeight, clientWidth, width, height } = el
  const [ dW, dH ] = [ clientWidth * pixelRatio, clientHeight * pixelRatio ]

  if (dH !== height || dW !== width)
    renderer.setSize(dW, dH, false)

  renderer.setClearColor('rgb(255, 255, 255)')
  renderer.shadowMap.enabled = true

  const camAspectRatio = dW / dH
  camera.aspect = camAspectRatio
  camera.updateProjectionMatrix()
}

function destroyThree () {
  window.removeEventListener('resize', initRendererAndCamera)
}

export {
  initThree
}