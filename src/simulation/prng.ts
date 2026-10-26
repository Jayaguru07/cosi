/**
 * Deterministic pseudo-random number generator (Mulberry32)
 * Ensures reproducible traffic generation across simulation runs.
 */
export class PRNG {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed >>> 0;
  }

  public setSeed(seed: number): void {
    this.state = seed >>> 0;
  }

  /**
   * Returns a pseudo-random 32-bit unsigned integer
   */
  public nextInt(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  /**
   * Returns a pseudo-random float in [0, 1)
   */
  public nextFloat(): number {
    return this.nextInt() / 4294967296;
  }

  /**
   * Returns a pseudo-random integer in [min, max] inclusive
   */
  public range(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  /**
   * Samples a vehicle type based on percentage composition
   */
  public sampleFromWeights<T extends string>(weights: Record<T, number>): T {
    const entries = Object.entries(weights) as [T, number][];
    const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
    if (totalWeight <= 0) return entries[0][0];

    const threshold = this.nextFloat() * totalWeight;
    let accumulated = 0;

    for (const [key, weight] of entries) {
      accumulated += weight;
      if (threshold <= accumulated) {
        return key;
      }
    }
    return entries[entries.length - 1][0];
  }
}
