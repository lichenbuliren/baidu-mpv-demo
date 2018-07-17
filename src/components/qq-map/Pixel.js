export default class Pixel {
  constructor (x, y) {
    this.x = x;
    this.y = y;
  }

  equals (pixel) {
    return (this.x === pixel.x && this.y === pixel.y)
  }
}