/* global qq */
import { getMapSize } from './utils'

function CanvasLayer(map, options) {
  this.setMap(map);
  this.options = options || {};
  this.paneName = this.options.paneName || 'mapPane';
  this.context = this.options.context  || '2d';
  this.zIndex = this.options.zIndex || 0;
  this.mixBlendMode = this.options.mixBlendMode || null;
  this.enableMassClear = this.options.enableMassClear;
  this._lastDrawTime = null;
  this.position = options.position
  qq.maps.Overlay.call(this);
  console.log('canvas layer init');
}

var global = typeof window === 'undefined' ? {} : window;

if (global.qq) {
  CanvasLayer.prototype = new qq.maps.Overlay();

  CanvasLayer.CSS_TRANSFORM = (function () {
    var div = document.createElement('div');
    var props = [
        'transform',
        'WebkitTransform',
        'MozTransform',
        'OTransform',
        'msTransform'
    ];

    for (var i = 0; i < props.length; i++) {
        var prop = props[i];
        if (div.style[prop] !== undefined) {
            return prop;
        }
    }

    return props[0];
  })();

  CanvasLayer.prototype.construct = function() {
    console.log('canvas construct');
    var mapSize = getMapSize(this.map);
    var canvas = this.canvas = document.createElement("canvas");
    canvas.style.cssText = `width: ${mapSize.width}px; height: ${mapSize.height}px;border: 1px solid red;box-sizing: border-box;`;
    this.getPanes().overlayLayer.appendChild(canvas);
    var that = this;
    this.changeHandler = qq.maps.event.addListener(this.map, 'bounds_changed', function() {
      console.log('bounds_changed')
      that.draw();
    })
    this.constructed = true;
    return this.canvas;
  }

  CanvasLayer.prototype.destory = function () {
    this.canvas.parentElement.removeChild(this.canvas)
    if (this.changeHandler) {
      qq.maps.event.removeListener(this.changeHandler)
      this.changeHandler = null
    }
    this.canvas = null
  }

  CanvasLayer.prototype.draw = function() {
    var self = this;
    var overlayProjection = this.getProjection();
    var bounds = this.map.getBounds()
    var topLeft = new qq.maps.LatLng(
      bounds.getNorthEast().getLat(),
      bounds.getSouthWest().getLng()
    )
    var point = overlayProjection.fromLatLngToDivPixel(topLeft);
    this.canvas.style[CanvasLayer.CSS_TRANSFORM] = `translate(${Math.round(point.x)}px, ${Math.round(point.y)}px)`
    clearTimeout(self.timeoutID);
    self.timeoutID = setTimeout(function() {
      self.update();
    }, 15);
  }

  CanvasLayer.prototype.update = function() {
    console.log('update render');
    this.resize();
    this.options.update && this.options.update.call(this);
  }

  CanvasLayer.prototype.resize = function() {
    if (!this.map) return;
    var size = getMapSize(this.map);
    var width = size.width;
    var height = size.height;
    var canvas = this.canvas;

    var devicePixelRatio = this.devicePixelRatio = global.devicePixelRatio || 1;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;

    if (this.context == '2d') {
        canvas.getContext(this.context).scale(devicePixelRatio, devicePixelRatio);
    }

    if (width == this.width && height == this.height) {
      return;
    }

    this.width = width;
    this.height = height;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
  }


  CanvasLayer.prototype.getContainer = function() {
      return this.canvas;
  }

  CanvasLayer.prototype.show = function() {
    this.canvas.style.display = "";
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
