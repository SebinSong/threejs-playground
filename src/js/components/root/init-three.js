import * as THREE from 'three'

let renderer, camera, scene, light;
const boxes = []
const render = () => renderer.render(scene, camera)

function initThree (canvasEl) {
  renderer = new THREE.WebGLRenderer({ canvas: canvasEl })

  const aniSettings = {
    tStart: null,
    f: 0.001
  }
  const [fov, aspect, near, far] = [45, 1, 1, 20]
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
  camera.position.z = 10

  // create Scene
  scene = new THREE.Scene()

  // Create boxes
  for (const [color, x] of [[0xFFF587, 0],[0xFF8C64, -2],[0xFF665A, 2]]) {
    createBox(color, x)
  }

  // light
  light = new THREE.DirectionalLight(0xFFFFFF, 1)
  light.position.set(-1, 2, 4)

  scene.add(light)
  boxes.forEach(box => scene.add(box))

  // set-up resize handler
  window.addEventListener('resize', () => adjustCameraAspectRatio(canvasEl))

  adjustCameraAspectRatio(canvasEl)
  render();
  animate();

  function animate (timeStamp) {
    const { tStart, f } = aniSettings

    if (!tStart)
      aniSettings.tStart = Date.now()

    const tNow = Date.now()
    const dAngle = (tNow - tStart) * f

    boxes.forEach((boxMesh, index) => {
      const angleChange = dAngle * (1 + index * 0.1)

      boxMesh.rotation.x = angleChange
      boxMesh.rotation.y = angleChange
    })

    camera.rotation.z = dAngle

    // re-render updated changes
    render()

    requestAnimationFrame(animate)
  }
};

// helpers
function radianToDegree (rad) { return rad / Math.PI * 180 }

function createBox (color = 0xFF6622, x = 0, y = 0) {
  const [w, h, depth] = [1, 1, 1]

  const geometry = new THREE.BoxGeometry(w, h, depth)
  const material = new THREE.MeshPhongMaterial({ color })
  const Mesh = new THREE.Mesh(geometry, material)

  Mesh.position.set(x, y, 0)
  boxes.push(Mesh)
}

function adjustCameraAspectRatio (canvasEl) {
  const [canvasW, canvasH] = [canvasEl.clientWidth, canvasEl.clientHeight]
  const pixelRatio = 1 // window.devicePixelRatio
  const aspectRatio = canvasW / canvasH

  
  if (canvasW !== canvasEl.width || canvasH !== canvasEl.height)
    renderer.setSize(canvasW * pixelRatio, canvasH * pixelRatio, false)

  if (camera.aspect !== aspectRatio) {
    camera.aspect = aspectRatio
    camera.updateProjectionMatrix()
  }
}

export default initThree;