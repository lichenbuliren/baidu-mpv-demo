/* global BMap,  */
import React from 'react'
// import maptalks from 'maptalks'
import * as mapv from 'mapv'
console.log(mapv);

export default class BaiduMap extends React.Component {
  static defaultProps = {
    id: 'baiduMap',
    height: '100%',
    style: {},
    data: [],
    // 默认天安门经纬度
    center: {
      lat: 39.915,
      lng: 116.404
    }
  }

  map
  state = {
    dataSet: []
  }
  
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    // this.initMap()
    this.pointTranslater()
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.data !== this.props.data) this.convertorData()
  }

  pointTranslater = () => {
    const { center } = this.props
    const convertor = new BMap.Convertor()
    const pointArr = []
    pointArr.push(center)
    // google 格式转百度地图
    convertor.translate(pointArr, 3, 5, this.initMap)
  }

  convertorData = () => {
    const { data } = this.props
    const sclieLen = 10
    const allPromise = []
    let i = 0
    while (i < data.length) {
      const curArr = data.slice(i, i + sclieLen)
      allPromise.push(this.convertor(curArr))
      i += sclieLen
    }

    Promise.all(allPromise).then(data => {
      const targetData = Array.prototype.concat.apply([], data)
      this.createMapVLayer(targetData)
    })
  }

  createMapVLayer = data => {
    const { data: source } = this.props
    console.log(source.length)
    const dataSet = data.map((point, i) => ({
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat]
      },
      count: source[i].cnt
    }))

    const max = Math.max(...source.map(item => item.cnt))

    const options = {
      fillStyle: 'rgba(55, 50, 250, 1)',
      shadowColor: 'rgba(255, 250, 50, 0.3)',
      shadowBlur: 20,
      size: 100,
      unit: 'm',
      globalAlpha: 0.6,
      label: {
          show: true,
          fillStyle: 'white',
          shadowColor: 'white',
          font: '12px Arial',
          shadowBlur: 10,
      },
      gradient: { 0: "rgb(149,147,242)", 0.25: "rgb(89,157,208)", 0.50: "rgb(118,252,37)", 0.75: "rgb(255,255,0)", 1.0: "#FD0300"},
      // gridWidth: 111,
      max: max,
      draw: 'grid'
    }

    const mapvLayer = new mapv.baiduMapLayer(this.map, new mapv.DataSet(dataSet), options)
  }

  convertor = source => {
    if (source.length === 0) return 
    const convertor = new BMap.Convertor()
    const points = source.map(point => new BMap.Point(point.lng, point.lat))
    return new Promise((resolve, reject) => {
      convertor.translate(points, 3, 5, newData => {
        if (newData.status === 0) resolve(newData.points)
        reject(newData.status)
      })
    })
  }

  initMap = data => {
    const { id, center } = this.props
    if (data.status === 0) {
      const centerPoint = data.points[0]
      const marker = new BMap.Marker(centerPoint)
      this.map = new BMap.Map(id)
      this.map.enableScrollWheelZoom(true)
      this.map.addOverlay(marker)
      this.map.addControl(new BMap.NavigationControl())
      this.map.centerAndZoom(centerPoint, 16)
      this.convertorData()
      console.log(this.map)
    }
  }

  render() {
    const { id, style } = this.props
    return <div id={id} style={style}></div>
  }
}