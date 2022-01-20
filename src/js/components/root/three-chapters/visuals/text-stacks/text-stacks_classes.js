import THREE from '@third-parties/three-old.js'
import { MeshLine, MeshLineMaterial } from 'meshline'
import { getGeometryBoundingBox, CombineMaterial } from '@three-util/utils-old.js'
import { degreeToRadian, randomSign, signOf } from '@view-util'
import fontJSONPath from '@assets/fonts/json/Passion_One_Regular.typeface.json'

const {
  Vector3, Object3D, Mesh, Group,
  PlaneGeometry, TextGeometry, BoxGeometry,
  MeshLambertMaterial, MeshBasicMaterial
} = THREE
const colors = {
  text: '#021F59',
  columnTop: '#38D0F2',
  columnSide: '#021F59'
}

// materials
const textSolidMaterial = new MeshLambertMaterial({
  color: colors.text, transparent: true, opacity: 1,
  side: THREE.DoubleSide
})
const textPlaneMaterials = [
  new MeshLambertMaterial({
    color: colors.columnTop, transparent: true, opacity: 1,
    side: THREE.DoubleSide
  }),
  new MeshBasicMaterial({
    color: colors.text, side: THREE.DoubleSide, wireframe: true
  })
]

class CharColumn extends Group {
  constructor ({
    char = 'A',
    columnHeight = 10,
    font = null, fontSize = 10
  }) {
    super()

    const fontPlaneSide = fontSize * 1.3
    const columnTop = new Group()
    // text
    const textGeometry = new TextGeometry(char, {
      font, size: fontSize, bevelEnabled: false, height: 0
    })
    const textBBox = getGeometryBoundingBox(textGeometry)
    const textMesh = new Mesh(textGeometry, textSolidMaterial)

    textMesh.rotation.x = Math.PI * -0.5
    textMesh.position.set(
      textBBox.width * -0.5,
      0.05,
      textBBox.height * 0.5
    )

    // text plane
    const textPlaneGeometry = new PlaneGeometry(fontPlaneSide, fontPlaneSide)
    const textPlaneBBox = getGeometryBoundingBox(textPlaneGeometry)
    const textPlaneMesh = new CombineMaterial(
      textPlaneGeometry, textPlaneMaterials, false, true
    )

    textPlaneMesh.rotation.x = Math.PI * -0.5

    // column body
    const columnBodyGeometry = new BoxGeometry(
      fontPlaneSide, fontPlaneSide, columnHeight)
    const columnBodyMaterial = new MeshLambertMaterial({
      color: colors.columnSide, transparent: true, opacity: 1,
      side: THREE.DoubleSide
    })
    const columnBody = new Mesh(columnBodyGeometry, columnBodyMaterial)
    
    columnBody.castShadow = true
    columnBody.rotation.x = Math.PI * -0.5
    columnBody.position.y = columnHeight / 2

    // add meshes to the object
    columnTop.add(textPlaneMesh, textMesh)
    columnTop.position.y = columnHeight

    this.add(columnTop)
    this.add(columnBody)

    this.columnTop = columnTop
    this.columnBody = columnBody
    this.textPlaneBBox = textPlaneBBox
  }
}

class TextColumns extends Group {
  constructor ({
    text = '', font = null,
    fontSize = 10, firstColumnHeight = 15,
    columnHeightDiff = 3, gap = 0
  }) {
    super()

    if (!text || !font) return
    
    const splitChars = text.split('')
    let textPlaneBBox = null

    splitChars.forEach((char, i) => {
      const column = new CharColumn({
        char, font, fontSize,
        columnHeight: firstColumnHeight + -1 * i * columnHeightDiff
      })
      
      if (!textPlaneBBox)
        textPlaneBBox = column.textPlaneBBox

      column.position.x = (textPlaneBBox.width + gap) * i
      this.add(column)
    })
  }
}

export {
  CharColumn, TextColumns
}