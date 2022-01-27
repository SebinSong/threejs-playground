import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { getGeometryBoundingBox, CombineMaterial,
  CombineWithEdge, OutlineGeometry, LineMesh } from '@three-util'
import { degreeToRadian } from '@view-util'

const { Mesh, Group, Vector3,
  PlaneGeometry, BoxGeometry, CircleGeometry,
  MeshLambertMaterial, MeshBasicMaterial, MeshToonMaterial,
} = THREE
const colors = {
  text: '#FFFFFF',
  text2: '#081A40',
  columnTop: '#0A7AA6',
  columnSide: '#D9310B',
  columnEdge: '#081A40',
  waveShape: '#F2B90C'
}
// materials
const textSolidMaterial = new MeshLambertMaterial({
  color: colors.text, transparent: true, opacity: 1,
  side: THREE.DoubleSide
})
const textSolidMaterial2 = new MeshLambertMaterial({
  color: colors.text2, side: THREE.DoubleSide
})
const textPlaneMaterial = new MeshLambertMaterial({
  color: colors.columnTop, transparent: true, opacity: 1,
  side: THREE.DoubleSide
})
const circleMaterial = new MeshBasicMaterial({ color: colors.waveShape })


class CharColumn extends Group {
  constructor ({
    char = 'A',
    columnHeight = 10,
    font = null, fontSize = 10,
    outlined = false,
    aniDelay = 0
  }) {
    super()

    const fontPlaneSide = fontSize * 1.3
    const columnTop = new Group()
    // text
    const textGeometry = new TextGeometry(char, {
      font, size: fontSize, bevelEnabled: false, height: 0
    })

    const textBBox = getGeometryBoundingBox(textGeometry)
    const textMesh = new Mesh(textGeometry, 
      outlined ? textSolidMaterial2 : textSolidMaterial)

    textMesh.rotation.x = Math.PI * -0.5
    textMesh.position.set(
      textBBox.width * -0.5,
      0.05,
      textBBox.height * 0.5)

    // text plane
    const textPlaneGeometry = new PlaneGeometry(fontPlaneSide, fontPlaneSide)
    const textPlaneBBox = getGeometryBoundingBox(textPlaneGeometry)
    const textPlaneMesh = new Mesh(
      textPlaneGeometry, textPlaneMaterial
    )

    textPlaneMesh.receiveShadow = true
    // new CombineWithEdge({
    //   geometry: textPlaneGeometry, 
    //   material: textPlaneMaterial,
    //   color: colors.columnEdge
    // }) 

    textPlaneMesh.rotation.x = Math.PI * -0.5

    // column body
    const columnBodyGeometry = new BoxGeometry(
      fontPlaneSide, fontPlaneSide, columnHeight)
    const columnBodyMaterial = new MeshToonMaterial({
      color: colors.columnSide, transparent: true, opacity: 1,
      side: THREE.DoubleSide
    })
    const columnBody = new CombineWithEdge({
      geometry: columnBodyGeometry, 
      material: columnBodyMaterial,
      shadow: true,
      edgeColor: colors.columnEdge
    })

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
    this.columnHeight = columnHeight
    this.char = char

    // animation settings
    this.aniSettings = {
      delay: aniDelay,
      tStart: null,
      scaleAmplitude: 0.25,
      angleSpeed: degreeToRadian(2.75),
      currAngle: 0
    }
  }

  update () {
    if (!this.aniSettings.tStart)
      this.aniSettings.tStart = Date.now()
      
    const tNow = Date.now()
    const { tStart, scaleAmplitude, 
      angleSpeed, delay } = this.aniSettings
    const tPassed = tNow - tStart

    if (tPassed <= delay)
      return

    this.aniSettings.currAngle += angleSpeed
    const currScaleAddition = scaleAmplitude * Math.sin(this.aniSettings.currAngle)
    const currZScale = 1 + currScaleAddition
  
    // column body
    this.columnBody.scale.z = currZScale

    // top plane
    this.columnTop.position.y = this.columnHeight * (1 + currScaleAddition / 2) + 0.5

  }
}

class TextColumns extends Group {
  constructor ({
    text = '', font = null,
    fontSize = 10, firstColumnHeight = 15,
    columnHeightDiff = 3, gap = 0,
    updateDelay = 0,
    outlined = 'odd' // either 'even' or 'odd'
  }) {
    super()

    if (!text || !font) return
    
    const isOddNum = v => v % 2 !== 0
    const isEvenNum = v => v % 2 === 0
    const outlineCheckFunc = outlined === 'odd' ? isOddNum : isEvenNum 

    const splitChars = text.split('')
    let textPlaneBBox = null

    this.meshArr = []
    splitChars.forEach((char, i) => {
      const column = new CharColumn({
        char, font, fontSize,
        columnHeight: firstColumnHeight + -1 * i * columnHeightDiff,
        outlined: outlineCheckFunc(i+1),
        aniDelay: updateDelay + 300 * i
      })

      if (!textPlaneBBox)
        textPlaneBBox = column.textPlaneBBox

      column.position.x = (textPlaneBBox.width + gap) * i
      
      this.meshArr.push(column)
      this.add(column)
    })
  }

  update () {
    this.meshArr.forEach(column => column.update())
  }
}

class CircleWaveShape extends Group {
  constructor ({
    name = 'circle',
    outlined = false,
    radius = 10,
    theta = 0
  }) {
    super()

    const geometry = new CircleGeometry(1.5, 32)
    const mesh = outlined ? 
      new OutlineGeometry(geometry, colors.waveShape) :
      new Mesh(geometry, circleMaterial)

    this.name = name
    this.add(mesh)
    this.rotation.x = -0.5 * Math.PI
    this.position.set(
      radius * Math.cos(theta),
      0,
      radius * Math.sin(theta)
    )

    this.shapeMesh = mesh
    this.theta = theta
    this.currRadius = radius
  }

  update (radius = 0) {
    if (this.currRadius >= radius) return

    this.position.set(
      radius * Math.cos(this.theta),
      0,
      radius * Math.sin(this.theta)
    )
    this.currRadius = radius
  }
}

class CircleWave extends Group {
  constructor ({
    initRadius = 20,
    dotAmount = 16,
    radiusMax = 65,
    shapeName = 'circle',
    outlined = false
  }) {
    super()

    this.shapeArr = []

    for (let i=0; i<dotAmount; i++) {
      const theta = (2 * Math.PI / dotAmount) * i
      const shape = new CircleWaveShape({
        name: shapeName, radius: initRadius,
        theta, outlined
      })

      this.shapeArr.push(shape)
      this.position.y = 0.2

      this.add(shape)
    }

    this.circleRadius = initRadius
    this.circleIncrement = 0.3
    this.circleRadiusMax = radiusMax
  }

  update () {
    this.circleRadius += this.circleIncrement
    this.shapeArr.forEach(shape => shape.update(this.circleRadius))
  }

  remove () { this.parent.remove(this) }
}

class CircleWaveCentral {
  constructor ({
    scene = null, initRadius = 20, radiusMax = 65,
    dotAmount = 24, interval = 2000
  }) {
    this.scene = scene
    this.circleInitRadius = initRadius
    this.radiusMax = radiusMax
    this.dotAmount = dotAmount
    this.waves = []

    this.aniSettings = { tPrev: null, interval: interval }
    this.outlined = false

    this.addWave()
  }

  addWave () {
    const wave = new CircleWave({
      shapeName: 'circle',
      initRadius: this.circleInitRadius,
      radiusMax: this.radiusMax,
      dotAmount: this.dotAmount,
      outlined: this.outlined
    })

    this.waves.push(wave)
    this.scene.add(wave)

    this.outlined = !this.outlined
  }

  update () {

    if (!this.aniSettings.tPrev)
      this.aniSettings.tPrev = Date.now()

    const { tPrev, interval } = this.aniSettings
    const tPassed = Date.now() - tPrev

    if (tPassed >= interval) {
      this.aniSettings.tPrev = Date.now()

      this.addWave()
    }

    const len = this.waves.length
    for (let i = len - 1; i>=0; i--) {
      const wave = this.waves[i]

      if (wave.circleRadius >= this.radiusMax) {
        this.waves.splice(i, 1)
        wave.remove()

        continue
      }

      wave.update()
    }
  }
}

class VerticalLines extends Group {
  constructor ({ lineSize = 200, planeSide = 100 }) {
    super()

    const half = planeSide / 2
    const mhalf = -1 * half
    const addLine = startP => {
      const pFrom = [...startP]
      const pTo = [startP.x, lineSize, startP.z]
      const mesh = new LineMesh({
        pFrom, pTo, color: colors.columnEdge
      })

      this.add(mesh)
    }

    const startPoints = [
      new Vector3(mhalf, 0, mhalf),
      new Vector3(mhalf, 0, half),
      new Vector3(half, 0, mhalf),
      new Vector3(half, 0, half)
    ]

    startPoints.forEach(p => addLine(p))
  }
}

export {
  CharColumn, TextColumns, CircleWaveCentral,
  VerticalLines
}