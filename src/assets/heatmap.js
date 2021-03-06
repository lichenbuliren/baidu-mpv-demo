(function () {
  var QQMapPlugin = window.QQMapPlugin = window.QQMapPlugin || {};

  function HeatmapOverlay(map, cfg) {
      this.setMap(map);
      this.map = map;
      this.cfg = cfg || {};
      qq.maps.Overlay.call(this);
  }

  HeatmapOverlay.prototype = new qq.maps.Overlay();

  HeatmapOverlay.CSS_TRANSFORM = (function () {
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


  HeatmapOverlay.prototype.construct = function () {
      var container = this.container = document.createElement('div');
      var map = this.map;
      var mapDiv = map.getContainer();
      var width = this.width = mapDiv.clientWidth;
      var height = this.height = mapDiv.clientHeight;


      this.cfg.container = container;

      container.style.cssText = 'width:' + width + 'px;height:' + height + 'px;';


      this.data = [];
      this.max = 1;
      this.min = 0;

      this.getPanes().overlayLayer.appendChild(container);
      var self = this;

      this.changeHandler = qq.maps.event.addListener(
          map,
          'bounds_changed',
          function () {
              self.draw();
          }
      );

      if (!this.heatmap) {
          this.heatmap = h337.create(this.cfg);
      }

      this.constructed = true;
  };

  HeatmapOverlay.prototype.show = function () {
      this.container.style.display = "";
  };

  HeatmapOverlay.prototype.hide = function () {
      this.container.style.display = "none";
  };

  HeatmapOverlay.prototype.destroy = function () {
      this.container.parentElement.removeChild(this.container);

      if (this.changeHandler) {
          qq.maps.event.removeListener(this.changeHandler);
          this.changeHandler = null;
      }

  };

  HeatmapOverlay.prototype.draw = function () {
      if (!this.map) {
          return;
      }

      var bounds = this.map.getBounds();

      var topLeft = new qq.maps.LatLng(
          bounds.getNorthEast().getLat(),
          bounds.getSouthWest().getLng()
      );

      var projection = this.getProjection();
      var point = projection.fromLatLngToDivPixel(topLeft);

      this.container.style[HeatmapOverlay.CSS_TRANSFORM] = 'translate(' +
      Math.round(point.x) + 'px,' +
      Math.round(point.y) + 'px)';

      this.update();
  };


  HeatmapOverlay.prototype.resize = function () {

      if (!this.map) {
          return;
      }

      var div = this.map.getContainer(),
          width = div.clientWidth,
          height = div.clientHeight;

      if (width == this.width && height == this.height) {
          return;
      }

      this.width = width;
      this.height = height;
      this.heatmap._renderer.setDimensions(width, height);
  };

  HeatmapOverlay.prototype.update = function () {
      var projection = this.map.getProjection(),
          zoom, scale, bounds, topLeft;

      if (!projection) {
          return;
      }

      bounds = this.map.getBounds();

      topLeft = new qq.maps.LatLng(
          bounds.getNorthEast().getLat(),
          bounds.getSouthWest().getLng()
      );

      zoom = this.map.getZoom();
      scale = Math.pow(2, zoom);

      this.resize();

      if (this.data.length == 0) {
          return;
      }

      var generatedData = {max: this.max, min: this.min};
      var latLngPoints = [];
      var len = this.data.length;
      var layerProjection = this.getProjection();
      var layerOffset = layerProjection.fromLatLngToDivPixel(topLeft);
      var radiusMultiplier = this.cfg.scaleRadius ? scale : 20;
      var localMax = 0;
      var localMin = 0;
      var valueField = this.cfg.valueField;
      while (len--) {
          var entry = this.data[len];
          var value = entry[valueField];
          var latlng = entry.latlng;
          if (!bounds.contains(latlng)) {
              continue;
          }
          localMax = Math.max(value, localMax);
          localMin = Math.min(value, localMin);


          var point = layerProjection.fromLatLngToDivPixel(latlng);
          var latlngPoint = {x: Math.round(point.x - layerOffset.x), y: Math.round(point.y - layerOffset.y)};
          latlngPoint[valueField] = value;

          var radius;

          if (entry.radius) {
              radius = entry.radius * radiusMultiplier;
          } else {
              radius = (this.cfg.radius || 2) * radiusMultiplier;
          }
          latlngPoint.radius = radius;
          latLngPoints.push(latlngPoint);
      }
      if (this.cfg.useLocalExtrema) {
          generatedData.max = localMax;
          generatedData.min = localMin;
      }

      generatedData.data = latLngPoints;
      this.heatmap.setData(generatedData);

  };

  HeatmapOverlay.prototype.setData = function (data) {
      var self = this;
      if (this.constructed) {
          this.max = data.max;
          this.min = data.min;

          var latField = this.cfg.latField || 'lat';
          var lngField = this.cfg.lngField || 'lng';
          var valueField = this.cfg.valueField || 'value';

          // transform data to latlngs
          var data = data.data;
          var len = data.length;
          var d = [];

          while (len--) {
              var entry = data[len];
              var latlng = new qq.maps.LatLng(entry[latField], entry[lngField]);
              var dataObj = {latlng: latlng};
              dataObj[valueField] = entry[valueField];
              if (entry.radius) {
                  dataObj.radius = entry.radius;
              }
              d.push(dataObj);
          }
          this.data = d;
          this.update();
      } else {
          //处理异步问题
          setTimeout(function () {
              self.setData(data);
          }, 100)
      }

  };
  HeatmapOverlay.prototype.addData = function (pointOrArray) {
      if (pointOrArray.length > 0) {
          var len = pointOrArray.length;
          while (len--) {
              this.addData(pointOrArray[len]);
          }
      } else {
          var latField = this.cfg.latField || 'lat';
          var lngField = this.cfg.lngField || 'lng';
          var valueField = this.cfg.valueField || 'value';
          var entry = pointOrArray;
          var latlng = new qq.maps.LatLng(entry[latField], entry[lngField]);
          var dataObj = {latlng: latlng};

          dataObj[valueField] = entry[valueField];
          if (entry.radius) {
              dataObj.radius = entry.radius;
          }
          this.max = Math.max(this.max, dataObj[valueField]);
          this.min = Math.min(this.min, dataObj[valueField]);
          this.data.push(dataObj);
          this.update();
      }
  };

  function supportCanvas() {
      var c = document.createElement("canvas");
      return !!(c.getContext && c.getContext("2d"));
  }

  QQMapPlugin["isSupportCanvas"] = supportCanvas();
  QQMapPlugin["HeatmapOverlay"] = HeatmapOverlay;
})();