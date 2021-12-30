import { WebGLRenderer, Scene, PerspectiveCamera,
	Mesh, PlaneGeometry, MeshLambertMaterial,
	AmbientLight, SpotLight } from 'three'
import { Axes, PlaneXY, Cube } from './utils.js'
import { degreeToRadian } from '@view-util'
import dat from 'dat.gui'

let renderer, scene, camera, axes, gridPlane, solidPlane
let spotLight, ambientLight
let cube
let animationRequestId = null

const render = () => renderer.render(scene, camera)
const colors = {
	background: '#FFFFFF',
	line: '#BFBAB0',
	plane: '#7D6B7D',
	light: '#FFFFFF',
	cubes: ['#F2059F', '#418FBF', '#F2E205', '#F24405']
}
const gui = { controller: null, instance: null }

function initThree (canvasEl) {
	// renderer & scene
	renderer = new WebGLRenderer({ canvas: canvasEl })
	scene = new Scene()

	// camera
	const [fov, nearPlane, farPlane] = [45, 0.1, 1000]
	camera = new PerspectiveCamera(fov, 1, nearPlane, farPlane)

	init()

	// lights
	ambientLight = new AmbientLight(colors.light)
	spotLight = new SpotLight(colors.light)
	spotLight.position.set(-40, 60, -10)
	spotLight.castShadow = true

	scene.add(ambientLight)
	scene.add(spotLight)

	// cube
	const cubeSize = 10
	cube = new Cube({
		size: cubeSize, color: colors.cubes[0],
		scene: scene, wireframe: true, wireColor: '#000000'
	})
	cube.position.set(cubeSize * 3, cubeSize * 2 / 3, cubeSize * 3)
	cube.rotation.x = Math.PI / 4
	cube.rotation.y = Math.PI / 4

	scene.add(cube)

	setupGUI()
	animate()
}

function init () {
	updateCanvasDimensions()
	setupEventListeners()

	renderer.setClearColor(colors.background)
	renderer.shadowMap.enabled = true

	// create coordinate axes & xy-plane
	const [planeWidth, planeHeight] = [60, 60]
	axes = new Axes({ color: colors.line, size: 120 })
	gridPlane = new PlaneXY({ color: colors.line, width: planeWidth, height: planeHeight })
	gridPlane.rotation.x = -0.5 * Math.PI
	gridPlane.position.z = planeHeight

	solidPlane = new Mesh (
		new PlaneGeometry(planeWidth, planeHeight, 1, 1),
		new MeshLambertMaterial({ color: colors.plane, transparent: true, opacity: 0.4 })
	)
	solidPlane.rotation.x = -0.5 * Math.PI
	solidPlane.position.set(planeWidth/2, 0, planeHeight/2)
	solidPlane.receiveShadow = true

	scene.add(axes)
	scene.add(solidPlane)
	scene.add(gridPlane)

	// adjust camera position & angle
	const camDist = Math.max(planeWidth, planeHeight) * 1.25
	camera.position.set(camDist, camDist, camDist)
	camera.lookAt(planeHeight/2, 0, planeWidth/2)
}

function animate () {
	animationRequestId = requestAnimationFrame(animate)

	const {
		scaleX, scaleY, scaleZ,
		rotationX, rotationY, rotationZ,
		translateX, translateY, translateZ
	} = gui.controller

	cube.children.forEach(child => {
		// sync the cube scale
		child.scale.set(scaleX, scaleY, scaleZ)
		child.rotation.set(
			degreeToRadian(rotationX),
			degreeToRadian(rotationY),
			degreeToRadian(rotationZ)
		)

		if (child.name === 'solid-cube')
			child.position.set(translateX, translateY, translateZ)
	})
	render()
}

function updateCanvasDimensions () {
	const pixelRatio = window.devicePixelRatio || 1
	const domEl = renderer.domElement
	const { 
		clientWidth, clientHeight,
		width: currentWidth, height: currentHeight 
	} = domEl
	const [desiredWidth, desiredHeight] = [
		clientWidth * pixelRatio, clientHeight * pixelRatio
	]
	const aspectRatio = clientWidth / clientHeight

	if (currentWidth !== desiredWidth || currentHeight !== desiredHeight)
		renderer.setSize(desiredWidth, desiredHeight, false)

	camera.aspect = aspectRatio
	camera.updateProjectionMatrix()
}

function setupGUI () {
	const guiInstance = new dat.GUI()
	const controller = {
		scaleX: 1,
		scaleY: 1,
		scaleZ: 1,
		rotationX: 0,
		rotationY: 0,
		rotationZ: 0,
		translateX: 0,
		translateY: 0,
		translateZ: 0
	}

	const scaleSlot = guiInstance.addFolder('scale')

	scaleSlot.add(controller, 'scaleX', 0, 3, 0.1)
	scaleSlot.add(controller, 'scaleY', 0, 3, 0.1)
	scaleSlot.add(controller, 'scaleZ', 0, 3, 0.1)

	const rotationSlot = guiInstance.addFolder('rotation')

	rotationSlot.add(controller, 'rotationX', -540, 540, 1)
	rotationSlot.add(controller, 'rotationY', -540, 540, 1)
	rotationSlot.add(controller, 'rotationZ', -540, 540, 1)

	const translateSlot = guiInstance.addFolder('translate')

	translateSlot.add(controller, 'translateX', -10, 10, 0.2)
	translateSlot.add(controller, 'translateY', -10, 10, 0.2)
	translateSlot.add(controller, 'translateZ', -10, 10, 0.2)

	gui.controller = controller
	gui.instance = guiInstance
}

function setupEventListeners () {
	window.addEventListener('resize', updateCanvasDimensions)
}

export {
	initThree
}