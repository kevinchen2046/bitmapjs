'use strict';

import { IColor } from "./Color";

export class ColorTransform {
	public redMultiplier: number;
	public greenMultiplier: number;
	public blueMultiplier: number
	public alphaMultiplier: number
	public redOffset: number
	public greenOffset: number
	public blueOffset: number
	public alphaOffset: number
	constructor(
		redMultiplier?: number, greenMultiplier?: number, blueMultiplier?: number,
		alphaMultiplier?: number,
		redOffset?: number, greenOffset?: number, blueOffset?: number,
		alphaOffset?: number) {
		this.redMultiplier = redMultiplier == undefined ? 1 : redMultiplier;
		this.greenMultiplier = greenMultiplier == undefined ? 1 : greenMultiplier;
		this.blueMultiplier = blueMultiplier == undefined ? 1 : blueMultiplier;
		this.alphaMultiplier = alphaMultiplier == undefined ? 1 : alphaMultiplier;
		this.redOffset = redOffset || 0;
		this.greenOffset = greenOffset || 0;
		this.blueOffset = blueOffset || 0;
		this.alphaOffset = alphaOffset || 0;
	}

	exec<T extends IColor>(pixel: T):T {
		pixel.r = Math.max(0,Math.min(255,pixel.r * this.redMultiplier + this.redOffset));
		pixel.g = Math.max(0,Math.min(255,pixel.g * this.greenMultiplier + this.greenOffset));
		pixel.b = Math.max(0,Math.min(255,pixel.b * this.blueMultiplier + this.blueOffset));
		pixel.a = Math.max(0,Math.min(255,pixel.a * this.alphaMultiplier + this.alphaOffset));
		return pixel;
	}
}

