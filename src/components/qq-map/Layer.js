import BaseLayer from "./BaseLayer";
import CanvasLayer from "./CanvasLayer";
import clear from "./canvas/clear";

class Layer extends BaseLayer {

  constructor(map, dataSet, options) {

    super(map, dataSet, options);

    var self = this;
    options = options || {};
    self.init(options);
    self.argCheck(options);
    var canvasLayer = this.canvasLayer = new CanvasLayer(map, {
      position: map.getCenter(),
      context: this.context,
      paneName: options.paneName,
      mixBlendMode: options.mixBlendMode,
      enableMassClear: options.enableMassClear,
      zIndex: options.zIndex,
      update: function () {
        // self.transferToMercator();
        self._canvasUpdate();
      }
    });

    dataSet.on('change', function () {
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
    if (!projection) return;
    var layerProjection = this.canvasLayer.getProjection();
    var bounds = this.map.getBounds();
    console.log(bounds);
    var topLeft = new qq.maps.LatLng(
      bounds.getNorthEast().getLat(),
      bounds.getSouthWest().getLng()
    )
    var zoom = this.map.getZoom();
    var scale = Math.pow(2, zoom);
    var layerOffset = layerProjection.fromLatLngToDivPixel(topLeft);
    console.log('transferToMercator');
    // 过滤出在视野范围内的点
    var data = this.dataSet.get();
    // data = data.filter(item => {
    //   var coordinates = item.geometry.coordinates;
    //   var latLng = new qq.maps.LatLng(coordinates[1], coordinates[0]);
    //   var isInBounds = bounds.contains(latLng);
    //   return isInBounds
    // });
    // 覆盖层，经纬度坐标转世界地图坐标
    data = this.dataSet.transferCoordinate(data, function (coordinates) {
      var latLng = new qq.maps.LatLng(coordinates[1], coordinates[0]);
      var point = projection.fromLatLngToPoint(latLng);
      return [point.x, point.y];
    }, 'coordinates', 'coordinates_mercator');
    console.log(data);
    this.dataSet._set(data);
  }

  getContext () {
    return this.canvasLayer.canvas.getContext(this.context);
  }

  _canvasUpdate () {
    var map = this.map;
    var projection = map.getProjection();
    if (!this.canvasLayer || !projection) {
      return;
    }

    var self = this;
    
    // var animationOptions = self.options.animation;
    var bounds = map.getBounds();
    var topLeft = new qq.maps.LatLng(
      bounds.getNorthEast().getLat(),
      bounds.getSouthWest().getLng()
    );
    var zoom = map.getZoom();
    // 计算缩放级别
    var zoomUnit = Math.pow(2, 17 - zoom);
    var layerProjection = this.canvasLayer.getProjection();
    var layerOffset = layerProjection.fromLatLngToDivPixel(topLeft);
    console.log(layerOffset);
    // var mcCenter = projection.fromLatLngToPoint(map.getCenter());
    // console.log('mcCenter', mcCenter);
    // var nwMc = new qq.maps.Point(mcCenter.x - (getMapSize(map).width / 2) * zoomUnit, mcCenter.y + (getMapSize(map).height / 2) * zoomUnit); //左上角墨卡托坐标

    var context = this.getContext();

    clear(context);

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

    var scale = this.canvasLayer.devicePixelRatio || 1;
    if (this.context != '2d') {
      scale = this.canvasLayer.devicePixelRatio;
    }

    let scaleSize = self.options.size;
    // get data from data set
    
    if (self.options.unit == 'm') {
      if (self.options.size) {
        self.options._size = self.options.size / zoomUnit;
        console.log(self.options._size, self.options.size / zoomUnit);
      }
    } else {
      self.options._size = self.options.size;
      self.options._height = self.options.height;
      self.options._width = self.options.width;
    }

    var dataGetOptions = {
      fromColumn: 'coordinates',
      // filter: item => {
      //   var coordinates = item.geometry.coordinates;
      //   var latLng = new qq.maps.LatLng(coordinates[1], coordinates[0]);
      //   var isInBounds = bounds.contains(latLng);
      //   return isInBounds
      // },
      transferCoordinate: function (coordinate) {
        var pixel = layerProjection.fromLatLngToDivPixel(new qq.maps.LatLng(coordinate[1], coordinate[0]));
        // 这里偏移网格大小的一半
        // var x = (coordinate[0] - nwMc.x) / zoomUnit;
        // var y = (nwMc.y - coordinate[1]) / zoomUnit * scale;
        return [pixel.x - layerOffset.x.toFixed(5), pixel.y - layerOffset.y.toFixed(5)];
      }
    }

    var data = self.dataSet.get(dataGetOptions);

    this.drawContext(context, data, self.options, {
      x: parseInt(layerOffset.x),
      y: parseInt(layerOffset.y)
    });
    
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
