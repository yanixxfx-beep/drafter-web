export type RNG = () => number

/**
 * Creates a deterministic random number generator from a seed string.
 * Uses a simple linear congruential generator (LCG).
 */
export const seededRNG = (seed: string): RNG => {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h >>> 0) / 4294967296
  }
}

/**
 * Creates a shuffled array of indices [0..n) using the provided RNG.
 * Uses Fisher-Yates shuffle algorithm.
 */
export const shuffledIndexArray = (n: number, rng: RNG): number[] => {
  const arr = [...Array(n).keys()]
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

