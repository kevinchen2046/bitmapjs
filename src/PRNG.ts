// Park-Miller-Carta Pseudo-Random Number Generator
export class PRNG {
    public seed: number;
    constructor() {
        this.seed = 1;
    }
    next() {
        return (this.gen() / 2147483647);
    }
    nextRange(min, max) {
        return min + ((max - min) * this.next());
    }
    gen() {
        return this.seed = (this.seed * 16807) % 2147483647;
    }
}
