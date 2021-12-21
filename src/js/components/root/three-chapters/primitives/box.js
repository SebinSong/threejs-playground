import { Mesh, BoxGeometry, MeshPhongMaterial } from 'three'

class Box extends Mesh {
  constructor ({
    color = 0xFFFFFF, x = 0, y = 0, z = 0,
    width = 1, height = 1, depth = 1
  }) {
    const geometry = new BoxGeometry(width, height, depth)
    const material = new MeshPhongMaterial({ color })

    super(geometry, material)

    this.geometry = geometry
    this.material = material

    this.position.set(x, y, z)
  }
}

export default Box;