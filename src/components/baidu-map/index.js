/* global BMap */
import React from 'react'

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
    data: []
  }
  
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    const { id, center } = this.props
    this.map = new BMap.Map(id)
    this.map.centerAndZoom(new BMap.Point(116.404, 39.915), 10)
    console.log(this.map)
  }

  render() {
    const { id, style } = this.props
    return <div id={id} style={style}></div>
  }
}