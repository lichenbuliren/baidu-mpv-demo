/**
 * 根据2点获取角度
 * @param Array [123, 23] 点1
 * @param Array [123, 23] 点2
 * @return angle 角度,不是弧度
 */
function getAngle(start, end) {
  var diff_x = end[0] - start[0];
  var diff_y = end[1] - start[1];
  var deg = 360 * Math.atan(diff_y / diff_x) / (2 * Math.PI);
  if(end[0] < start[0]){
      deg = deg + 180;
  }
  return deg;
}

function getMapSize(map) {
  var mapContainer = map.container
  return {
    width: mapContainer.clientWidth,
    height: mapContainer.clientHeight
  }
}

/**
 * 根据地图缩放级别，得到当前缩放下的绘制网格区域大小
 * 最小缩放范围为 12
 * @param {number} zoom 地图缩放级别 
 * @param {number} girdSize 网格实际地理位置大小，单位为 'm' 
 * @param {number} ruler 比例尺宽度，单位为 'px'
 */
const getGridWidthByZoom = (zoom, gridSize = 100, ruler = 100) => {
  let ratio = 1
  switch (zoom) {
    case 18:
      ratio = 2
      break
    case 17:
      ratio = 1
      break
    case 16:
    case 15:
      ratio = 0.5
      break
    case 14:
      ratio = 0.25
      break
    case 13:
      ratio = 0.1
      break
    default:
      ratio = 0.05
      break;
  }
  return gridSize * ratio
}

export {
  getAngle,
  getMapSize,
  getGridWidthByZoom
}