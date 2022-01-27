import * as THREE from 'three'
import { CombineWithEdge } from '@three-util'
import { randomSign, degreeToRadian } from '@view-util'

const {
  MeshToonMaterial, MeshStandardMaterial,
  CircleGeometry, BoxGeometry,
  Group, Mesh
} = THREE

const colors = {
  buildings: ['#D9310B', '#F2B90C', '#081A40', '#F2B90C', '#0A7AA6'],
  buildingEdge: '#000000',
  smoke: '#FFFF00'
}

let buildingIndex = 0, carIndex = 0

class Smoke extends Group {
  constructor ({
    distance =  20,
    particleRadius = 0.2,
    amount = 100, color = '#FFFFFF',
    rotationSpeed = degreeToRadian(0.2)
  }) {
    super()

    const material = new MeshToonMaterial({ 
      color, side: THREE.DoubleSide, transparent: true,
      opacity: 1
    })
    const geometry = new CircleGeometry(particleRadius, 32)
    const randomFloat = v => randomSign() * v * Math.random()

    this.particles = []
    for (let i=0; i<amount; i++) {
      const particle = new Mesh(geometry, material)

      particle.position.set(
        randomFloat(distance),
        randomFloat(distance),
        randomFloat(distance)
      )

      this.particles.push(particle)
      this.add(particle)
    }

    this.rotationSpeed = rotationSpeed
  }

  update () {
    this.rotation.x += this.rotationSpeed
    this.rotation.y += this.rotationSpeed
  }
}

class Building extends Group {
  constructor (args) {
    super()

    const {
      sideLength = 1,
      height = 1,
      segments = 2,
      color = '#FFFFFF'
    } = args
    const colorSet = colors.buildings

    const geometry = new BoxGeometry(
      sideLength * 0.95, height, sideLength * 0.95,
      segments, segments, segments
    )
    const floorGeometry = new BoxGeometry(sideLength, 0.05, sideLength)
    const material = new MeshStandardMaterial({
      color: colorSet[buildingIndex % colorSet.length], side: THREE.DoubleSide
    })
    buildingIndex++

    const building = new CombineWithEdge({
      geometry, material, edgeColor: colors.buildingEdge, 
      shadow: true })
    const floor = new Mesh(floorGeometry, material)

    building.position.y = height / 2

    this.args = args
    this.add(building, floor)
  }
}

class Town extends Group {
  constructor ({
    rangeLength = 20,
    buildingAmount = 1,
    sideLength = 1,
    heightMin = 1,
    heightMax = 1,
    segments = 2,
    color = '#000000'
  }) {
    super()

    this.buildings = null
    const partitions = [
      { name:'pxpz', def: [rangeLength, rangeLength], children: [] },
      { name: 'mxpz', def: [-1*rangeLength, rangeLength], children: [] },
      { name: 'mxmz', def: [-1*rangeLength, -1*rangeLength], children: [] },
      { name: 'pxmz', def: [rangeLength, -1*rangeLength], children: [] }
    ]
    const checkIfAnyOverlap = (pos, children) => {
      return children.some(child => {
        const [dx, dz] = [
          Math.abs(child.position.x - pos.x),
          Math.abs(child.position.z - pos.z)
        ]

        return dx < sideLength || dz < sideLength
      })
    } 

    for (let i=0; i<buildingAmount; i++) {
      const { def, children } = partitions[i % partitions.length]
      const building = new Building({ sideLength, 
        height: heightMin + Math.random() * (heightMax - heightMin), 
        segments, color })
      const [xRange, zRange] = def
      let regenCount = 0

      do {
        if (regenCount++ > 3)
          break;

        building.position.x = Math.round(xRange * Math.random())
        building.position.z = Math.round(zRange * Math.random())
      } while (checkIfAnyOverlap(building.position, children))

      children.push(building)
      this.add(building)
    }

    this.buildings = partitions.map(item => item.children)
      .reduce((accu, curr) => [...accu, ...curr], [])
  }
}

class Car extends Mesh {
  constructor ({ distance = 20, length = 2, yMax = 4, xzRange = 4 }) {
    carIndex++

    const thickness = length / 60
    const along = carIndex % 2 === 1 ? 'x' : 'z'
    const perpendicular = along === 'x' ? 'z' : 'x'
    const material = new MeshToonMaterial({ color: colors.smoke, side: THREE.DoubleSide })
    
    let geometry

    if (along === 'x')
      geometry = new BoxGeometry(length, thickness, thickness)
    else
      geometry = new BoxGeometry(thickness, thickness, length)

    super(geometry, material)

    const sign = randomSign()
    const velSign = -1 * sign

    this.position[along] = sign * distance
    this.position.y = 1 + (yMax * 0.7 * Math.random())
    this.position[perpendicular] = randomSign() * (xzRange* 0.6 * Math.random())

    this.velocity = {
      current: 0.025, init: 0.025, sign: velSign,
      accel: 0.0125, max: 1.15
    }

    this.along = along
    this.distance = distance
  }

  resetVelocity () {
    this.velocity.sign *= -1
    this.velocity.current = this.velocity.init
  }

  update () {
    const clamp = (v, max) => {
      if (v < -1 * max) v = -1 * max
      else if (v > max) v = max

      return v
    }

    const { current, sign, accel, max } = this.velocity
    const currPos = this.position[this.along]
    
    this.velocity.current = clamp(current + accel, max)
    this.position[this.along] = clamp(currPos + sign * this.velocity.current, this.distance)

    if (Math.abs(this.position[this.along]) >= this.distance)
      this.resetVelocity()
  }
}

export {
  Smoke, Building, Town, Car
}