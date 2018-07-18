import React from 'react'
import { QMap, Marker, MarkerList } from '../react-qmap'
import QMapVLayer from './Layer'
import DataSet from './data/DataSet'

export default class QQMap extends React.Component {
  static defaultProps = {
    id: 'QMap',
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

  componentWillReceiveProps (nextProps) {
    // if (nextProps.data !== this.props.data) this.convertorData()
  }

  createMapVLayer = (map) => {
    const { data: source } = this.props
    const dataSet = source.map((point, i) => ({
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat]
      },
      count: source[i].cnt
    }))

    const max = Math.max(...source.map(item => item.cnt))

    const options = {
      zIndex: 1,
      position: map.getCenter(),
      fillStyle: 'rgba(55, 50, 250, 1)',
      shadowColor: 'rgba(255, 250, 50, 0.3)',
      shadowBlur: 20,
      size: 20,
      // unit: 'm',
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

    if (!this.mapvLayer) {
      this.mapvLayer = new QMapVLayer(map, new DataSet(dataSet), options)
    } 
  }

  handleTilesloaded = map => {
    console.log('idle once')
    this.createMapVLayer(map)
  }

  render() {
    const { id, style, center, data } = this.props
    return (
      <React.Fragment>
        <div id={id} style={{height: '50vh', width: '80%', margin: '0 auto'}}>
          <QMap
            center={center}
            zoom={16}
            style={{height: '100%'}}
            events={{
              idle: this.handleTilesloaded
            }}
            style={{height: '100vh', width: '100%'}}
          >
            <MarkerList data={data} />
          </QMap>
        </div>
      </React.Fragment>
    )
  }
}