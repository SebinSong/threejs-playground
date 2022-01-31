import * as THREE from 'three'
import { randomSign, degreeToRadian } from '@view-util'

const {
  SphereGeometry, Mesh, BufferGeometry,
  MeshStandardMaterial, MeshBasicMaterial, LineBasicMaterial,
  Group, Vector3, Line
} = THREE
let randomVectorCount = 0

class Particle extends Mesh {
  constructor ({ 
    color = '#FFFFFF',
    position = new Vector3(0,0,0),
    radius = '0.5',
    dirVector = new Vectoe3(0,0,0),
    sphereRadius = 1
  }) {
    const geometry = new SphereGeometry(radius, 32, 32)
    const material = new MeshBasicMaterial({
      color, side: THREE.DoubleSide,
      transparent: true, opacity: 1
    })

    super(geometry, material)

    this.position.copy(position)
    this.originalPosition = position
    this.dirVector = dirVector
    this.sphereRadius = sphereRadius

    this.ani = {
      currentAngle: Math.random() * Math.PI,
      angleSpeed: degreeToRadian(2.5 + 2.5 * Math.random()),
      amplitude: sphereRadius / 400
    }
  }

  update () {
    const { currentAngle: prevAngle, 
      amplitude, angleSpeed } = this.ani
    this.ani.currentAngle = prevAngle + angleSpeed

    const additionalRadius = amplitude * Math.sin(this.ani.currentAngle)
    const additionalVector = this.dirVector.clone().multiplyScalar(additionalRadius)
    const newPos = this.originalPosition.clone().add(additionalVector)

    this.position.copy(newPos)
  }
}

class Sphere extends Group {
  constructor ({
    color = '#FFFFFF',
    particleRadius = 0.5,
    particleAmount = 100,
    sphereRadius = 5,
    spherePosition = new Vector3(0,0,0),
    rotationSpeed = degreeToRadian(0.3)
  }) {
    super()

    this.particles = []

    this.rotationSpeed = rotationSpeed
    this.position.copy(spherePosition)

    for (let i=0; i<particleAmount; i++) {
      const dirVector = randomVector3()
      const particle = new Particle({
        color,
        dirVector,
        sphereRadius,
        position: dirVector.multiplyScalar(sphereRadius),
        radius: particleRadius
      })

      this.particles.push(particle)
      this.add(particle)
    }
  }

  update () {
    this.rotation.y += this.rotationSpeed

    this.particles.forEach(particle => particle.update())
  }
}

class WaveDot extends Vector3 {
  constructor ({
    x = 0, y = 0, z = 0,
    delay = 0, amplitude = 0,
    angleSpeed = 0, noUpdate = false
  }) {
    super(x, y, z)

    this.originalPosition = { x, y, z }
    this.ani = {
      tStart: null, delay, amplitude, 
      angleSpeed, currentAngle: 0, noUpdate,
      trigFunc: Math.random() > 0.5 ? Math.sin : Math.cos
    }
  }

  update () {
    const { noUpdate, amplitude, delay, tStart, 
      angleSpeed, trigFunc } = this.ani
    const tNow = Date.now()

    if (noUpdate) return

    if (!tStart) {
      this.ani.tStart = tNow
      
      return
    }
    
    if (tNow - this.ani.tStart < delay) return

    this.ani.currentAngle += angleSpeed
    const yAdditional = amplitude * trigFunc(this.ani.currentAngle)

    this.y = this.originalPosition.y + yAdditional
  }
}

class WaveEntity extends Group {
  constructor ({
    color = '#FFFFFF',
    dotAmount = 8,
    length = 16,
    position = new Vector3(0,0,0)
  }) {

    super()
    this.dots = []

    const material = new LineBasicMaterial({ color, transparent: true, opacity: 1 })
    const geometry = new BufferGeometry()

    const LENGTH_UNIT = length / dotAmount
    const xStart = length / 2 * -1
    for (let i=0; i<=dotAmount; i++) {
      const noUpdate = i % dotAmount === 0 // the first & the last dots
      const dot = new WaveDot({
        noUpdate,
        x: xStart + LENGTH_UNIT * i, 
        y: noUpdate ? 0 : randomSign() * Math.random() * 1.2, 
        z: 0,
        amplitude: 0.6 + Math.random() * 0.4,
        angleSpeed: degreeToRadian(6 + 3 * Math.random()),
        // delay: 50 * i
      })

      this.dots.push(dot)
    }

    geometry.setFromPoints(this.dots)

    const mesh = new Line(geometry, material)
    mesh.geometry.attributes.position.needsUpdate = true 
    // NOTE: if this is not turned on, calling geometry.setFromPoints() won't update.

    this.add(mesh)
    this.position.copy(position)

    this.mesh = mesh
    this.geometry = geometry
    this.material = material
  }

  update () {
    this.dots.forEach(dot => dot.update())

    this.geometry.setFromPoints(this.dots)
  }
}

class Waves extends Group {
  constructor ({
    waveAmount = 3,
    dotAmount = 8,
    length = 10,
  }) {
    super()
    this.waves = []

    const rgbMin = 140
    const rgbUnit = (225 - rgbMin) / (dotAmount - 1)

    const rgbString = v => {
      v = Math.round(v)
      return `rgb(${v}, ${v}, ${v})`
    }

    for (let i=0; i<waveAmount; i++) {
      const color = rgbString(rgbMin + i * rgbUnit)
      console.log('color: ', color)
      const wave = new WaveEntity({ color, dotAmount, length })

      this.waves.push(wave)
      this.add(wave)
    }
  }

  update () {
    this.waves.forEach(wave => wave.update())
  }
}

function randomBetween (a, b) {
  return a + (b - a) * Math.random()
}

// helper functions
function randomVector3WithLimit (f = 1) {
  return () => new Vector3(
    randomSign() * Math.random() * f,
    randomSign() * randomBetween(1 - f, 1),
    randomSign() * Math.random() * f
  ).normalize() 
}

function randomVector3 () {

  const genFuncs = [
    randomVector3WithLimit(0.4),
    randomVector3WithLimit(0.75),
    randomVector3WithLimit(0.85)
  ]
  const genFunc = genFuncs[randomVectorCount % genFuncs.length]
  randomVectorCount++

  return genFunc()
}

export {
  Particle, Sphere, WaveEntity, Waves
}