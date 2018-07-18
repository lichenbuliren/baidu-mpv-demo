import BaseLayer from "./BaseLayer";
import CanvasLayer from "./CanvasLayer";
import clear from "./canvas/clear";
import { getMapSize } from './utils'
import Pixel from './Pixel'

class Layer extends BaseLayer {

  constructor(map, dataSet, options) {

    super(map, dataSet, options);

    var self = this;
    options = options || {};
    console.log('layer init')

    // this.clickEvent = this.clickEvent.bind(this);
    // this.mousemoveEvent = this.mousemoveEvent.bind(this);
    self.init(options);
    self.argCheck(options);
    // self.transferToMercator();
    var canvasLayer = this.canvasLayer = new CanvasLayer(map, {
      position: map.getCenter(),
      context: this.context,
      paneName: options.paneName,
      mixBlendMode: options.mixBlendMode,
      enableMassClear: options.enableMassClear,
      zIndex: options.zIndex,
      update: function () {
        self._canvasUpdate();
      }
    });

    dataSet.on('change', function () {
      console.log('dataSet on change')
      // self.transferToMercator();
      canvasLayer.draw();
    });

  }

  clickEvent (e) {
    var pixel = e.pixel;
    super.clickEvent(pixel, e);
  }

  mousemoveEvent (e) {
    var pixel = e.pixel;
    super.mousemoveEvent(pixel, e);
  }

  bindEvent (e) {
    this.unbindEvent();
    var map = this.map;

    if (this.options.methods) {
      if (this.options.methods.click) {
        this.clickMapHandler = qq.maps.event.addListener(this.map, 'click', this.clickEvent)
      }
      if (this.options.methods.mousemove) {
        this.mouseMoveMapHandler = qq.maps.event.addListener(this.map, 'mousemove', this.mousemoveEvent)
      }
    }
  }

  unbindEvent (e) {
    if (this.options.methods) {
      if (this.options.methods.click) {
        qq.maps.event.removeListener(this.clickMapHandler);
      }
      if (this.options.methods.mousemove) {
        qq.maps.event.removeListener(this.mouseMoveMapHandler);
      }
    }
  }

  // 经纬度左边转换为墨卡托坐标
  transferToMercator () {
    var projection = this.map.getProjection();
    var layerProjection = this.canvasLayer.getProjection();
    var bounds = this.map.getBounds();
    var topLeft = new qq.maps.LatLng(
      bounds.getNorthEast().getLat(),
      bounds.getSouthWest().getLng()
    )
    var layerOffset = layerProjection.fromLatLngToDivPixel(topLeft);
    console.log('transferToMercator');
    var data = this.dataSet.get();
    // 覆盖层
    data = this.dataSet.transferCoordinate(data, function (coordinates) {
      var latLng = new qq.maps.LatLng(coordinates[1], coordinates[0]);
      var point = projection.fromLatLngToPoint(latLng);
      return [Math.round(point.x - layerOffset.x), Math.round(point.y - layerOffset.y)];
    }, 'coordinates', 'coordinates_mercator');
    console.log(data[0])
    this.dataSet._set(data);
  }

  getContext () {
    return this.canvasLayer.canvas.getContext(this.context);
  }

  _canvasUpdate (time) {
    var projection = this.map.getProjection();
    if (!this.canvasLayer || !projection) {
      return;
    }

    var self = this;

    var animationOptions = self.options.animation;
    this.transferToMercator();
    var map = this.map;
    var bounds = this.map.getBounds();
    var topLeft = new qq.maps.LatLng(
      bounds.getNorthEast().getLat(),
      bounds.getSouthWest().getLng()
    );
    var zoom = map.getZoom();
    var zoomUnit = Math.pow(2, zoom);
    var layerProjection = this.canvasLayer.getProjection();
    var layerOffset = layerProjection.fromLatLngToDivPixel(topLeft);
    var mcCenter = projection.fromLatLngToPoint(map.getCenter());
    var nwMc = new qq.maps.Point(mcCenter.x - (getMapSize(map).width / 2) * zoomUnit, mcCenter.y + (getMapSize(map).height / 2) * zoomUnit); //左上角墨卡托坐标
    console.log('nwMC', nwMc);

    var context = this.getContext();

    if (self.isEnabledTime()) {
      if (time === undefined) {
        clear(context);
        return;
      }
      if (this.context == '2d') {
        context.save();
        context.globalCompositeOperation = 'destination-out';
        context.fillStyle = 'rgba(0, 0, 0, .1)';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.restore();
      }
    } else {
      clear(context);
    }

    if (this.context == '2d') {
      for (var key in self.options) {
        context[key] = self.options[key];
      }
    } else {
      context.clear(context.COLOR_BUFFER_BIT);
    }

    if (self.options.minZoom && map.getZoom() < self.options.minZoom || self.options.maxZoom && map.getZoom() > self.options.maxZoom) {
      return;
    }

    var scale = 1;
    if (this.context != '2d') {
      scale = this.canvasLayer.devicePixelRatio;
    }
    var dataGetOptions = {
      fromColumn: 'coordinates_mercator',
      transferCoordinate: function (coordinate) {
        var x = (coordinate[0] - nwMc.x) / zoomUnit * scale;
        var y = (nwMc.y - coordinate[1]) / zoomUnit * scale;
        return [x, y];
      }
    }

    if (time !== undefined) {
      dataGetOptions.filter = function (item) {
        var trails = animationOptions.trails || 10;
        if (time && item.time > (time - trails) && item.time < time) {
          return true;
        } else {
          return false;
        }
      }
    }

    // get data from data set
    var data = self.dataSet.get(dataGetOptions);
    this.processData(data);

    var nwPixel = this.canvasLayer.getProjection().fromLatLngToDivPixel(new qq.maps.LatLng(0, 0));
    console.log('qq nwPixel', nwPixel);
    if (self.options.unit == 'm') {
      if (self.options.size) {
        self.options._size = self.options.size / zoomUnit;
      }
      if (self.options.width) {
        self.options._width = self.options.width / zoomUnit;
      }
      if (self.options.height) {
        self.options._height = self.options.height / zoomUnit;
      }
    } else {
      self.options._size = self.options.size;
      self.options._height = self.options.height;
      self.options._width = self.options.width;
    }

    this.drawContext(context, data, self.options, nwPixel);
    self.options.updateCallback && self.options.updateCallback(time);
  }

  init (options) {
    var self = this;
    self.options = options;
    // 调用父类方法，得到颜色分割区间
    this.initDataRange(options);
    // 设置 canvas 绘制上下文
    this.context = self.options.context || '2d';

    if (self.options.zIndex) {
      this.canvasLayer && this.canvasLayer.setZIndex(self.options.zIndex);
    }

    if (self.options.max) {
      this.intensity.setMax(self.options.max);
    }

    if (self.options.min) {
      this.intensity.setMin(self.options.min);
    }

    // 父类方法动画方法，如果 draw 类别为 「time」类型
    this.initAnimator();
    this.bindEvent();

  }

  addAnimatorEvent () {
    qq.maps.event.addListener(this.map, 'movestart', this.animatorMovestartEvent.bind(this))
    qq.maps.event.addListener(this.map, 'moveend', this.animatorMoveendEvent.bind(this))
    // this.map.addEventListener('movestart', this.animatorMovestartEvent.bind(this));
    // this.map.addEventListener('moveend', this.animatorMoveendEvent.bind(this));
  }

  // show () {
  //   this.map.addOverlay(this.canvasLayer);
  // }

  // hide () {
  //   this.map.removeOverlay(this.canvasLayer);
  // }

  draw () {
    this.canvasLayer.draw();
  }
}

export default Layer;
