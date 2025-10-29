export function mulberry32(seed: string) {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }

  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h = h ^ (h >>> 16)
    return (h >>> 0) / 4294967296
  }
}

export function jitterSeed(seed: string, salt: string) {
  return `${seed}::${salt}`
}

