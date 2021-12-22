function randomFromArray (arr) {
  if (Array.isArray(arr))
    return arr[Math.floor(Math.random() * arr.length)]
  else
    return null
}

function randomIntFromRange (from, to) {
  to = to % 1 === 0 ? to + 0.1 : to
  const gap = (to - from)
  return Math.floor(from + Math.random() * gap)
}

export {
  randomFromArray,
  randomIntFromRange
}