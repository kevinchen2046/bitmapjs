"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRNG = void 0;
// Park-Miller-Carta Pseudo-Random Number Generator
class PRNG {
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
exports.PRNG = PRNG;
