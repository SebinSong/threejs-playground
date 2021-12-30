import {
  Line, 
  
  BufferGeometry, BoxGeometry, SphereGeometry,

  LineBasicMaterial, LineDashedMaterial, MeshLambertMaterial, MeshPhongMaterial,

  Vector3, Group, Mesh
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
    this.computeLineDistances()

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
  }
}

class Cube extends Mesh {
  constructor ({ 
    size = 1,
    color = '#000000',
    index = 0,
    scene = null
  }) {
    const geometry = new BoxGeometry (size, size, size)
    const material = new MeshLambertMaterial({ color })

    super(geometry, material)
    this.castShadow = true
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

export {
  LineMesh,
  Axes,
  PlaneXY,
  Cube,
  Sphere
}