///////////////////////////////////
// -------------------------------
// @author:Kevin.Chen
// @date:2016-5-17下午3:03:35
// @email:kevin-chen@foxmail.com
// -------------------------------
///////////////////////////////////

export class ColorUtil {

	/**
	 * 颜色随机
	 * @returns 
	 */
	public static randColor() {
		return Math.floor(Math.random() * (0xFFFFFF + 1));
	}

	/**
	 * 颜色随机
	 * @returns 
	 */
	public static randColor32() {
		return Math.floor(Math.random() * (0xFFFFFFFF + 1));
	}

	/**
	 * 颜色变亮 
	 * @return 
	 */
	public static toBright(color: number, offset: number = 0x66): number {
		const { r, g, b } = this.extract(color);
		return this.merge(r + offset, g + offset, b + offset);
	}

	/**
	 * 颜色变亮 
	 * @return 
	 */
	public static toBright32(color: number, offset: number = 0x66): number {
		const { a, r, g, b } = this.extract32(color);
		return this.merge32(a, r + offset, g + offset, b + offset);
	}

	/**
	 * 颜色变暗
	 * @return 
	 */
	public static toDark(color: number, offset: number = 0x66): number {
		const { r, g, b } = this.extract(color);
		return this.merge(r - offset, g - offset, b - offset);
	}

	/**
	 * 颜色变暗
	 * @return 
	 */
	public static toDark32(color: number, offset: number = 0x66): number {
		const { a, r, g, b } = this.extract32(color);
		return this.merge32(a, r - offset, g - offset, b - offset);
	}

	/**
	 * 从颜色值中提取三原色 
	 * @param color
	 * @return 
	 */
	public static extract(color: number): { r: number, g: number, b: number } {
		return {
			r: ((color & 0xff0000) >> 16),
			g: ((color & 0x00ff00) >> 8),
			b: ((color & 0x0000ff))
		}
	}

	/**
	 * 从32位颜色值中提取三原色 
	 * @param color
	 * @return 
	 */
	public static extract32(color: number): { a: number, r: number, g: number, b: number } {
		return {
			a: ((color >> 24) & 0xff),
			r: ((color & 0x00ff0000) >> 16),
			g: ((color & 0x0000ff00)) >> 8,
			b: ((color & 0x000000ff))
		}
	}

	/**
	 * 将三原色合并 
	 * @param r
	 * @param g
	 * @param b
	 * @return 
	 */
	public static merge(r: number, g: number, b: number): number {
		return Math.max(0, Math.min(r, 0xFF)) << 16 | Math.max(0, Math.min(g, 0xFF)) << 8 | Math.max(0, Math.min(b, 0xFF));
	}


	/**
	 * 将带有通道信息的三原色合并 
	 * @param r
	 * @param g
	 * @param b
	 * @return 
	 */
	public static merge32(a: number, r: number, g: number, b: number): number {
		return Math.max(0, Math.min(a, 0xFF)) << 24 | Math.max(0, Math.min(r, 0xFF)) << 16 | Math.max(0, Math.min(g, 0xFF)) << 8 | Math.max(0, Math.min(b, 0xFF));
	}

	/**
	 * 将三原色合并 
	 * @param r
	 * @param g
	 * @param b
	 * @return 
	 */
	public static mergeFrom(color: { r: number, g: number, b: number }): number {
		return this.merge(color.r, color.g, color.b)
	}

	/**
	 * 将带有通道信息的三原色合并 
	 * @param r
	 * @param g
	 * @param b
	 * @return 
	 */
	public static mergeFrom32(color: { a: number, r: number, g: number, b: number }): number {
		return this.merge32(color.a, color.r, color.g, color.b);
	}
	/**
	 * 颜色相加
	 * @param color
	 * @param arg 其他颜色
	 * @return 
	 */
	public static add(color: number, ...colors): number {
		let { r: R, g: G, b: B } = this.extract(color);
		for (var temColor of colors) {
			const { r, g, b } = this.extract(temColor);
			R += r;
			G += g;
			B += b;
		}
		return this.merge(R, G, B);
	}

	/**
	 * 颜色相加
	 * @param color
	 * @param arg 其他颜色
	 * @return 
	 */
	public static add32(color: number, ...colors): number {
		let { a: A, r: R, g: G, b: B } = this.extract32(color);
		for (var temColor of colors) {
			const { a, r, g, b } = this.extract32(temColor);
			A += a;
			R += r;
			G += g;
			B += b;
		}
		return this.merge32(A, R, G, B);
	}

	/**
	 * 颜色相减
	 * @param color
	 * @param other
	 * @return 
	 */
	public static sub(color: number, ...colors): number {
		let { r: R, g: G, b: B } = this.extract(color);
		for (var temColor of colors) {
			const { r, g, b } = this.extract(temColor);
			R -= r;
			G -= g;
			B -= b;
		}
		return this.merge(R, G, B);
	}

	/**
	 * 颜色相减
	 * @param color
	 * @param other
	 * @return 
	 */
	public static sub32(color: number, ...colors): number {
		let { a: A, r: R, g: G, b: B } = this.extract32(color);
		for (var temColor of colors) {
			const { a, r, g, b } = this.extract32(temColor);
			A -= a;
			R -= r;
			G -= g;
			B -= b;
		}
		return this.merge32(A, R, G, B);
	}

	/**
	 * 从32位颜色中提取透明通道的值 
	 * @param color
	 * @return 
	 */
	public static extractAlphaFrom32(color: number): number {
		return color >> 24;
	}

	/**
	  * 将传入的 uint 类型颜色值转换为字符串型颜色值,带"#"号。
	  * @param color 颜色值。
	  * @return 字符串型颜色值。
	  */
	public static toHexColor(color: number): string {
		if (color < 0 || isNaN(color)) return null;
		var str: string = color.toString(16);
		while (str.length < 6) str = `0${str}`;
		return `#${str}`;
	}

	/**
	  * 将传入的 字符串 类型颜色值转换为uint颜色值。
	  * @param color 颜色值。
	  * @return uint颜色值。
	  */
	public static toColor(color: string): number {
		if (color == undefined) return 0;
		color = color.replace(/ /g, '').replace(/#/g, '').replace(/0x/g, '');
		return parseInt(color, 16);
	}

	/**
	 * 传入三原色 返回HSV的颜色表达 {H:颜色值(0-360),S:飽和度(0-1.0),V:明度(0-1.0)}
	 * @param R 
	 * @param G 
	 * @param B 
	 * @returns {H:number,S:number,V:number}
	 */
	public static toHsv(R: number, G: number, B: number) {
		R /= 255;
		G /= 255;
		B /= 255;
		var maxValue = Math.max(R, G, B);
		var minValue = Math.min(R, G, B);

		var V: number = maxValue;
		var S: number = (V != 0) ? 1.0 - minValue / maxValue : 0.0;
		var H: number;
		if (maxValue == minValue)
			return null;
		if (R == maxValue && G >= B)
			H = Math.PI / 3 * (G - B) / (maxValue - minValue) + 0;    // H = 60 * (G - B) / (maxValue - minValue) + 0;
		if (R == maxValue && G < B)
			H = Math.PI / 3 * (G - B) / (maxValue - minValue) + 2 * Math.PI;   // H = 60 * (G - B) / (maxValue - minValue) + 360;
		if (G == maxValue)
			H = Math.PI / 3 * (B - R) / (maxValue - minValue) + 2 * Math.PI / 3; // H = 60 * (G - B) / (maxValue - minValue) + 120;
		if (B == maxValue)
			H = Math.PI / 3 * (R - G) / (maxValue - minValue) + 4 * Math.PI / 3; // H = 60 * (G - B) / (maxValue - minValue) + 240;
		return { H: H, S: S, V: V };
	}

	/**
	 * 取模
	 * @param v 
	 */
	public static mod(v: number, v1): number {
		return Math.abs(v % v1);
	}
	/**
	 * 传入HSV颜色 返回RGB的颜色表达
	 * @param H 
	 * @param S 
	 * @param V 
	 */
	public static toRgb(H: number, S: number, V: number) {
		var hi = this.mod(Math.floor(H / (Math.PI / 3)), 6);    // hi = floor( H / 60° ) mod 6
		var f = H / (Math.PI / 3) - hi;               // H = 60 * (G - B) / (maxValue - minValue) + 0;
		var p = V * (1 - S);
		var q = V * (1 - f * S);
		var t = V * (1 - (1 - f) * S);
		var R: number, G: number, B: number;
		switch (hi) {
			case 0: R = V; G = t; B = p; break;       // (R, G, B) = (V, t, p)
			case 1: R = q; G = V; B = p; break;       // (R, G, B) = (q, V, p)
			case 2: R = p; G = V; B = t; break;       // (R, G, B) = (p, V, t)
			case 3: R = p; G = q; B = V; break;       // (R, G, B) = (p, q, V)
			case 4: R = t; G = p; B = V; break;       // (R, G, B) = (t, p, V)
			case 5: R = V; G = p; B = q; break;       // (R, G, B) = (V, p, q)
		}
		return { R: (R * 255) >> 0, G: (G * 255) >> 0, B: (B * 255) >> 0 };
	}

	/**
	 * CMYK色彩模式，该模式是以打印油墨在纸张上的光线吸收特性为基础，图像中每个像素都是由靛青(C)、品红(M)、黄(Y)和黑(K)按照不同比例组成。
	 * 每个像素的每种印刷油墨会被分配一个百分比例，最亮的颜色分配较低的印刷油墨颜色百分比，较暗的颜色分配较高的百分比。
	 * @param C 
	 * @param M 
	 * @param Y 
	 * @param K 
	 */
	public static cmykToRgb(C: number, M: number, Y: number, K: number) {
		return {
			R: (1.0 - C) * (1.0 - K),
			G: (1.0 - M) * (1.0 - K),
			B: (1.0 - Y) * (1.0 - K)
		}
	}

	public static gamma(channel: number) {
		channel /= 255;
		if (channel > 0.04045) {
			return Math.pow((channel + 0.055) / 1.055, 2.4);
		} else {
			return channel / 12.92;
		}
	}

	public static toXYZ(R: number, G: number, B: number) {
		// 0.436052025    0.385081593    0.143087414
		// 0.013929122    0.097097002    0.714185470
		return { x: 0.222491598 * this.gamma(R), y: 0.716886060 * this.gamma(G), z: 0.060621486 * this.gamma(B) };
	}

	/**
	 * Lab色彩模型是由亮度（L，Luminosity）和有关色彩的a、b三个要素组成。a表示从洋红色到绿色的范围，b表示由黄色到蓝色的范围。L取值[0, 100]
	 * @param R 
	 * @param G 
	 * @param B 
	 */
	public static toLab(R: number, G: number, B: number) {
		var { x, y, z } = this.toXYZ(R, G, B);
		function f(t: number) {
			if (t > Math.pow(6.0 / 29.0, 3)) {
				return Math.pow(t, 1.0 / 3.0);
			} else {
				return 1.0 / 3.0 * Math.pow(29.0 / 6.0, 2.0) * t + 4.0 / 29.0;
			}
		}
		var Xn, Yn, Zn = 1;
		var L = 116 * f(y / Yn) - 16;
		var a = 500 * (f(x / Xn) - f(y / Yn));
		var b = 200 * (f(y / Yn) - f(z / Zn));
		return { L: L, a: a, b: b };
	}
}
