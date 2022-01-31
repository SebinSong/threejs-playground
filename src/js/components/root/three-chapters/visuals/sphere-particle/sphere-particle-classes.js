import * as THREE from 'three'
import { randomSign, degreeToRadian } from '@view-util'

const {
  SphereGeometry, Mesh, 
  MeshStandardMaterial, MeshBasicMaterial,
  Group, Vector3
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
  Particle, Sphere
}