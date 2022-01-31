import * as THREE from 'three'
import { CombineWithEdge, CombineMaterial } from '@three-util'
import { randomSign, degreeToRadian } from '@view-util'

const {
  MeshToonMaterial, MeshStandardMaterial, MeshLambertMaterial, MeshPhongMaterial,
  CircleGeometry, BoxGeometry, PlaneGeometry,
  GridHelper,
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
    particleRadius = 0.05,
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
    const randomAngle = () => randomSign() * Math.random() * Math.PI

    this.particles = []
    for (let i=0; i<amount; i++) {
      const particle = new Mesh(geometry, material)

      particle.position.set(
        randomFloat(distance),
        randomFloat(distance),
        randomFloat(distance)
      )
      particle.rotation.x = randomAngle()
      particle.rotation.y = randomAngle()
      particle.rotation.z = randomAngle()

      this.particles.push(particle)
      this.add(particle)
    }

    this.position.y = 4

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
      color = '#000000'
    } = args

    const geometry = new BoxGeometry(
      sideLength * 0.95, height, sideLength * 0.95,
      segments, segments, segments
    )
    const floorGeometry = new BoxGeometry(sideLength, 0.05, sideLength)
    const material = new MeshStandardMaterial({
      color, // colorSet[buildingIndex % colorSet.length],
      side: THREE.DoubleSide,
      metalness: 0.6,
      roughness: 10
    })
    const wireMaterial = new MeshLambertMaterial({
      color: '#FFFFFF', side: THREE.DoubleSide, wireframe: true,
      opacity: 0.025, transparent: true
    })

    buildingIndex++

    const floor = new Mesh(floorGeometry, material)
    const building = new CombineMaterial(geometry, [material, wireMaterial], true)

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
  constructor ({ distance = 20, length = 2, yMax = 4, 
    xzRange = 4, delay = 0 }) {
    carIndex++

    const thickness = length / 400
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
      sign: velSign,
      current: 0.025, init: 0.025, 
      accel: 0.003 + Math.random() * 0.01, 
      max: 0.3 + Math.random() * 0.2
    }
    this.aniStatus = { tStart: null, delay }

    this.along = along
    this.distance = distance
  }

  resetVelocity () {
    this.velocity.sign *= -1
    this.velocity.current = this.velocity.init

    // this.aniStatus.tStart = null
  }

  update () {
    const tNow = Date.now()

    if (!this.aniStatus.tStart)
      this.aniStatus.tStart = tNow

    const { tStart, delay } = this.aniStatus
    const tPassed = tNow - tStart

    if (tPassed <= delay) return

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

class LazorCars extends Group {
  constructor ({
    carLength = 2, travelDistance = 40, yMax = 4,
    xzRange = 4, carAmount = 20
  }) {
    super()
    this.cars = []

    for (let i=0; i<carAmount; i++) {
      const car = new Car({ 
        distance: travelDistance, length: carLength,
        yMax, xzRange,
        delay: 500 + Math.random() * 2000
      })

      this.cars.push(car)
      this.add(car)
    }
  }

  update () { this.cars.forEach(car => car.update()) }
}

class Plane extends Group {
  constructor ({ gridMiddleColor = '#FFFFFF', color = "#000000", size = 20 }) {
    super()

    const geometry = new PlaneGeometry(size, size)
    const material = new MeshPhongMaterial({ 
      color, shininess: 50, transparent: true, opacity: 1,
      side: THREE.DoubleSide
    })
    const plane = new Mesh(geometry, material)
    const grid = new GridHelper(size, size*2, gridMiddleColor, color)

    plane.receiveShadow = true
    plane.rotation.x = Math.PI * -0.5

    this.add(plane)
    this.add(grid)    
  }
}

export {
  Smoke, Building, Town, Car, LazorCars, Plane
}