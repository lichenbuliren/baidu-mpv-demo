/* global qq */
import { getMapSize } from './utils'

function CanvasLayer(options) {
  this.options = options || {};
  this.paneName = this.options.paneName || 'mapPane';
  this.context = this.options.context  || '2d';
  this.zIndex = this.options.index || 0;
  this.mixBlendMode = this.options.mixBlendMode || null;
  this.enableMassClear = this.options.enableMassClear;
  this._lastDrawTime = null;
  this.position = options.position
  if (options.map) {
    this._map = options.map
    this.setMap(options.map)
  }
  // this.show();
}

var global = typeof window === 'undefined' ? {} : window;

if (global.qq) {

  CanvasLayer.prototype = new qq.maps.Overlay();

  CanvasLayer.prototype.construct = function() {
    var canvas = this.canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;" + "left:0;" + "top:0;" + "z-index:" + this.zIndex + ";user-select:none;pointer-events: none;border: 1px solid red";
    canvas.style.mixBlendMode = this.mixBlendMode;
    this.adjustSize();
    var panes = this.getPanes()
    panes.overlayMouseTarget.appendChild(canvas);
    var that = this;
    qq.maps.event.addListener(this.map, 'resize', function() {
      that.adjustSize();
      that._draw()
    })
    return this.canvas;
  }

  CanvasLayer.prototype.adjustSize = function() {
    var size = getMapSize(this.map);
    var canvas = this.canvas;

    var devicePixelRatio = this.devicePixelRatio = global.devicePixelRatio || 1;

    canvas.width = size.width * devicePixelRatio;
    canvas.height = size.height * devicePixelRatio;
    if (this.context == '2d') {
        canvas.getContext(this.context).scale(devicePixelRatio, devicePixelRatio);
    }

    canvas.style.width = size.width + "px";
    canvas.style.height = size.height + "px";
  }

  CanvasLayer.prototype.destory = function () {
    this.canvas.parentNode.removeChild(this.canvas)
    this.canvas = null
  }

  CanvasLayer.prototype.draw = function() {
    var self = this;
    clearTimeout(self.timeoutID);
    self.timeoutID = setTimeout(function() {
      self._draw();
    }, 15);
  }

  CanvasLayer.prototype._draw = function() {
    var overlayProjection = this.getProjection();
    var size = getMapSize(this.map)
    // 中心坐标点
    var pixel = overlayProjection.fromLatLngToDivPixel(this.position);
    this.canvas.style.left = pixel.x - size.width / 2 + 'px';
    this.canvas.style.top = pixel.y - size.height / 2 + 'px';
    // this.dispatchEvent('draw');
    this.options.update && this.options.update.call(this);
  }

  CanvasLayer.prototype.getContainer = function() {
      return this.canvas;
  }

  CanvasLayer.prototype.show = function() {
    if (!this.canvas) {
      this.setMap(this.map)
    }
    this.canvas.style.display = "block";
  }

  CanvasLayer.prototype.hide = function() {
      this.canvas.style.display = "none";
  }

  CanvasLayer.prototype.setZIndex = function(zIndex) {
      this.zIndex = zIndex;
      this.canvas.style.zIndex = this.zIndex;
  }

  CanvasLayer.prototype.getZIndex = function() {
      return this.zIndex;
  }

}

export default CanvasLayer;
