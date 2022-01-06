import React, {
  useRef, useEffect
} from 'react'
import { initThree } from './three-chapters/overall/chap6-extrude-1'

import './App.scss'

function App (props) {
  // ref
  const canvasRef = useRef(null)

  // effects
  useEffect(() => {
    initThree(canvasRef.current)

    return () => {
      // terminate threejs if any
    }
  }, []) // mounted hook

  return (
    <div className="app-container">
      <canvas id="three-canvas"
        ref={canvasRef}></canvas>
    </div>
  )
}

export default App 