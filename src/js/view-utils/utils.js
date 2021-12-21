function randomFromArray (arr) {
  if (Array.isArray(arr))
    return arr[Math.floor(Math.random() * arr.length)]
  else
    return null
}

export {
  randomFromArray
}