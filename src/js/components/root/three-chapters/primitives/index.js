import { 
  WebGLRenderer, Scene,
  PerspectiveCamera,
  DirectionalLight
} from 'three';
import { randomFromArray } from '@view-util'
import Box from './box.js'

const colors = [0xF2059F, 0x418FBF, 0xF2E205, 0xF2CB05, 0xF24405]
let renderer, scene, camera, object, light;
const render = () => renderer.render(scene, camera)

function initThree (canvasEl) {
  renderer = new WebGLRenderer({ canvas: canvasEl })
  scene = new Scene()

  // adjust camera aspect ratio and 
  initCameraAndRenderer()
  setUpEventListeners()

  object = new Box({
    color: colors[0] // randomFromArray(colors)
  })
  light = new DirectionalLight(0xFFFFFF, 1)
  light.position.set(0, 2, 2);

  scene.add(light)
  scene.add(object)

  render()
}

// helpers
function setUpEventListeners () {
  window.addEventListener('resize', initCameraAndRenderer)
}

function initCameraAndRenderer () {
  const { clientWidth, clientHeight,
    width: canvasWidth, height: canvasHeight } = renderer.domElement
  const pixelRatio = window.devicePixelRatio || 1
  const aspectRatio = clientWidth / clientHeight
  const [ desiredW, desiredH ] = [ clientWidth * pixelRatio, clientHeight * pixelRatio ]

  if (canvasWidth !== desiredW || canvasHeight !== desiredH)
    renderer.setSize(desiredW, desiredH, false)

  const [fov, near, far, zPos] = [45, 1, 100, 5]
  if (!camera) {
    camera = new PerspectiveCamera(fov, aspectRatio, near, far)
    camera.position.set(0, 0, zPos)

  } else if (camera?.aspect !== aspectRatio) {
    camera.aspect = aspectRatio
    camera.updateProjectionMatrix()
  }
}

function destroyThree () {
  window.removeEventListener('resize', initCameraAndRenderer)
}

const Components = { 
  renderer, scene, camera, object
}
export {
  initThree,
  destroyThree,
  Components
};
