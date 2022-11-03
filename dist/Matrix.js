'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Matrix = void 0;
const Util_1 = require("./Util");
class Matrix {
    constructor(a, b, c, d, tx, ty) {
        this.elements = [a || 1, c || 0, tx || 0,
            b || 0, d || 1, ty || 0];
        this.angle = 0; // faster but dumber method
    }
    get a() {
        return this.elements[0];
    }
    set a(n) {
        this.elements[0] = n;
    }
    get b() {
        return this.elements[3];
    }
    set b(n) {
        this.elements[3] = n;
    }
    get c() {
        return this.elements[1];
    }
    set c(n) {
        this.elements[1] = n;
    }
    get d() {
        return this.elements[4];
    }
    set d(n) {
        this.elements[4] = n;
    }
    get tx() {
        return this.elements[2];
    }
    set tx(n) {
        this.elements[2] = n;
    }
    get ty() {
        return this.elements[5];
    }
    set ty(n) {
        this.elements[5] = n;
    }
    clone() {
    }
    concat(m) {
    }
    identity() {
        this.elements = [1, 0, 0, 1, 0, 0];
    }
    scale(sx, sy) {
        if (sx && !sy) {
            sy = sx;
        }
        if (sx && sy) {
            this.elements[0] *= sx;
            this.elements[1] *= sy;
            this.elements[3] *= sx;
            this.elements[4] *= sy;
        }
    }
    translate(dx, dy) {
        this.elements[2] = dx * this.elements[0] + dy *
            this.elements[1] + this.elements[2];
        this.elements[5] = dx * this.elements[3] + dy * this.elements[4] +
            this.elements[5];
    }
    rotate(angle) {
        this.angle += angle;
        var r = Util_1.Util.radianToAngle(angle);
        var c = Math.cos(angle);
        var s = Math.sin(angle);
        var temp1 = this.elements[0];
        var temp2 = this.elements[1];
        this.elements[0] = c * temp1 + s * temp2;
        this.elements[1] = -s * temp1 + c * temp2;
        temp1 = this.elements[3];
        temp2 = this.elements[4];
        this.elements[3] = c * temp1 + s * temp2;
        this.elements[4] = -s * temp1 + c * temp2;
    }
}
exports.Matrix = Matrix;
