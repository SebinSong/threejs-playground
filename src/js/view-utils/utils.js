import easeFuncFactory from './easeFunctionFactory'

function randomFromArray (arr) {
  if (Array.isArray(arr))
    return arr[Math.floor(Math.random() * arr.length)]
  else
    return null
}

function randomIntFromRange (from, to) {
  to = to % 1 === 0 ? to + 0.1 : to
  const range = (to - from)
  
  return Math.floor(from + Math.random() * range)
}

function degreeToRadian (deg) { return deg / 180 * Math.PI }
function randomSign () { return Math.random() <0.5 ? 1 : -1 }
function randomBetween (a, b) { return a + Math.ceil(Math.random() * (b - a)) }
function signOf (v) { return v < 0 ? -1 : 1 }
export {
  randomFromArray,
  randomIntFromRange,
  degreeToRadian,
  randomBetween,
  randomSign,
  signOf,
  easeFuncFactory
}