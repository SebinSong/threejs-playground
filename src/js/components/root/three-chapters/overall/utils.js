import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  Line, BufferGeometry, BoxGeometry,
  LineBasicMaterial, LineDashedMaterial,
  MeshLambertMaterial, MeshBasicMaterial,
  MeshDepthMaterial, MultiplyBlending,
  SphereGeometry, Vector3, Group, Mesh
} from 'three'

class LineMesh extends Line {
  constructor ({
    pFrom = [0, 0, 0],
    pTo = [1, 1, 1],
    dashed = false,
    width = 1,
    color = '#000000'
  }) {
    const MaterialConstructor = dashed ?
      LineDashedMaterial :
      LineBasicMaterial;

    const materialObj = Object.assign({}, { 
      color, linewidth: width
    },
    dashed && {
      dashSize: 2, gapSize: 0.6
    })
    const material = new MaterialConstructor(materialObj)
    const geometry = new BufferGeometry().setFromPoints([
      new Vector3(...pFrom),
      new Vector3(...pTo)
    ])

    super(geometry, material)
    this.computeLineDistances() // IMPORTANT for 'dashed' to work

    this.material = material
    this.geometry = geometry
  }
}

class Axes extends Group {
  constructor ({ color = '#000000', 
    size = 50, dashed = false,
    width = 1 } = {}) {
    
    const dotsTo = [
      [size, 0, 0], [0, size, 0], [0, 0, size]
    ]

    super()
    dotsTo.forEach((coor, index) => {
      this.add(
        new LineMesh({ color: color, pTo: coor, 
          dashed, width })
      )
    })
  }
}

class PlaneXY extends Group {
  constructor ({ color = '#000000',  
    gridGap = 1, width = 50, height = 50, 
    dashed = false } = {}) {
    super()

    for (let x=0; x<=width; x += gridGap) {
      this.add(new LineMesh({
        pFrom: [x, 0, 0], pTo: [x, height, 0], color, dashed
      }))
    }

    for (let y=0; y<=height; y += gridGap) {
      this.add(new LineMesh({
        pFrom: [0, y, 0], pTo: [width, y, 0], color, dashed
      }))
    }

    this.dimensions = { width, height }
  }
}

class Cube extends Group {
  constructor ({ 
    size = 1,
    color = '#000000',
    index = 0,
    scene = null,
    wireColor = '#000000'
  }) {
    super()

    const geometry = new BoxGeometry (size, size, size)
    const [ solidMesh, wiredMesh ] = [
      new Mesh(geometry, new MeshLambertMaterial({ color })),
      new Mesh(geometry, new MeshBasicMaterial({ color: wireColor, wireframe: true })),
    ]

    solidMesh.name = 'solid-cube'
    wiredMesh.name = 'wired-cube'
    this.add(solidMesh)
    this.add(wiredMesh)

    this.children[0].castShadow = true
    this.name = `cube-${index}`
    this.scene = scene
    this.sideLength = size
  }

  remove () { this.scene.remove(this) }
}

class Sphere extends Mesh {
  constructor ({
    radius = 1, color = '#000000',
    scene = null
  }) {
    const geometry =  new SphereGeometry(radius, 32, 16)
    const material = new MeshLambertMaterial({ color })

    super(geometry, material)
    this.scene = scene
  }

  remove () { this.scene.remove(this) }
}

class CombineMaterial extends Group {
  constructor (geometry, materials, shadow = false) {
    super()

    for (const material of materials) {
      const mesh = new Mesh (geometry, material)

      mesh.castShadow = shadow
      this.add(mesh)
    }

    this.geometry = geometry
    this.castShadow = shadow
  }

  // static methods
  static clone (instance) {
    const spreadVec3 = v => [v.x, v.y, v.z]
    const { 
      children, geometry, castShadow,
      position, rotation, scale } = instance
    const materialArr = children.map(mesh => mesh.material.clone())
    const newInstance = new CombineMaterial(geometry.clone(), materialArr, castShadow)
    
    newInstance.position.set(...spreadVec3(position))
    newInstance.scale.set(...spreadVec3(scale))
    newInstance.rotation.set(rotation._x, rotation._y, rotation._z)

    return newInstance
  }

  // instance methods
  updateGeometry (newGeo) {
    this.geometry = newGeo
    this.children.forEach(mesh => { mesh.geometry = newGeo })
  }
}

class DepthSphere extends CombineMaterial {
  constructor ({
    radius = 1, color = '#000000',
    scene = null
  }) {
    const geometry =  new SphereGeometry(radius, 32, 16)
    const materials = [
      new MeshLambertMaterial({ 
        color, transparent: true,
        blending: MultiplyBlending
      }),
      new MeshDepthMaterial()
    ]

    super(geometry, materials)
    this.scene = scene
  }

  remove () { this.scene.remove(this) }
}

// util functions
function getGeometryBoundingBox (geometry) {
  geometry.computeBoundingBox()

  if (!geometry.boundingBox)
    return null

  const spreadVector = ({x, y, z}) => [x, y, z]
  const { min, max } = geometry.boundingBox
  const half = key => {
    const halfLength = (max[key] - min[key]) / 2
    return min[key] + halfLength
  }

  const center = new Vector3(half('x'), half('y'), half('z'))
  const [ width, height, depth ] = [
    Math.abs(max.x - min.x), Math.abs(max.y - min.y), Math.abs(max.z - min.z)
  ]

  return {
    min: spreadVector(min),
    max: spreadVector(max),
    center, width, height, depth // width : x-axis, height: y-axis, depth: z-axis
  }
}

export {
  LineMesh,
  Axes,
  PlaneXY,
  Cube,
  Sphere,
  CombineMaterial,
  DepthSphere,
  getGeometryBoundingBox,
  ParametricGeometry,
  OrbitControls
}