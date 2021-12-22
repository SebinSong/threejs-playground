import {
  Line, BufferGeometry,
  LineBasicMaterial, LineDashedMaterial,
  Vector3, Group
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
      dashSize: 3, gapSize: 2
    })
    const material = new MaterialConstructor(materialObj)
    const geometry = new BufferGeometry().setFromPoints([
      new Vector3(...pFrom),
      new Vector3(...pTo)
    ])

    super(geometry, material)
    this.material = material
    this.geometry = geometry
  }
}

class Axes extends Group {
  constructor ({ color = '#000000', size = 50 } = {}) {
    
    const dotsTo = [
      [size, 0, 0], [0, size, 0], [0, 0, size]
    ]

    super()
    dotsTo.forEach(coor => {
      this.add(new LineMesh({ color, pTo: coor }))
    })
  }
}

class PlaneXY extends Group {
  constructor ({ color = '#000000', size = 50, gridGap = 1 } = {}) {
    super()

    for (let i=0; i<=50; i += gridGap) {
      const xLine = new LineMesh({
        pFrom: [i, 0, 0], pTo: [i, size, 0], color
      })
      const yLine = new LineMesh({
        pFrom: [0, i, 0], pTo: [size, i, 0], color
      })

      this.add(xLine)
      this.add(yLine)
    }
  }
}

export {
  LineMesh,
  Axes,
  PlaneXY
}