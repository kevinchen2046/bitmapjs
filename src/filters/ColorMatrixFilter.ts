'use strict';

import { Rectangle } from "../Rectangle";


export class ColorMatrixFilter {
	public matrix: number[];
	constructor(matrix?: number[]) {
		this.matrix = matrix || [
			1, 0, 0, 0, 0,
			0, 1, 0, 0, 0,
			0, 0, 1, 0, 0,
			0, 0, 0, 1, 0
		];
	}

	run(sourceRect: Rectangle, pixels: Uint8Array, copy?: Uint8Array) {
		var numPixel = pixels.length / 4;
		var m = this.matrix;

		for (var i = 0; i < numPixel; i++) {
			var r = i * 4;
			var g = r + 1;
			var b = r + 2;
			var a = r + 3;

			var oR = pixels[r];
			var oG = pixels[g];
			var oB = pixels[b];
			var oA = pixels[a];

			pixels[r] = (m[0] * oR) + (m[1] * oG) + (m[2] * oB) +
				(m[3] * oA) + m[4];
			pixels[g] = (m[5] * oR) + (m[6] * oG) + (m[7] * oB) +
				(m[8] * oA) + m[9];
			pixels[b] = (m[10] * oR) + (m[11] * oG) + (m[12] * oB) +
				(m[13] * oA) + m[14];
			pixels[a] = (m[15] * oR) + (m[16] * oG) + (m[17] * oB) +
				(m[18] * oA) + m[19];
		}
	};

	clone() {
		return new ColorMatrixFilter(this.matrix);
	};
}
