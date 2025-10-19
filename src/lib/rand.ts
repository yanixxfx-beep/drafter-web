export function mulberry32(seedStr: string) {
  let h = 1779033703 ^ seedStr.length
  for (let i = 0; i < seedStr.length; i++) { 
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19) 
  }
  return function() { 
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    const t = (h ^= h >>> 16) >>> 0
    return t / 4294967296
  }
}

// Helper function to get random index from array using seed
export function getRandomIndex(seed: string, arrayLength: number): number {
  const rnd = mulberry32(seed)
  return Math.floor(rnd() * arrayLength)
}

// Helper function to get random item from array using seed
export function getRandomItem<T>(seed: string, array: T[]): T {
  const index = getRandomIndex(seed, array.length)
  return array[index]
}