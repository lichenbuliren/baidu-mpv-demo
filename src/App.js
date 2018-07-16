import React from 'react'
import BaiduMap from './components/baidu-map'
import QQMap from './components/qq-map'
import data from './data'

export default class App extends React.Component {
  state = {
    center: {
      lat: 31.16861,
      lng: 121.40725
    }
  }
  render () {
    const { center } = this.state
    return <BaiduMap center={center} data={data} style={{ height: '100vh', width: '100vw' }} />
    // return <QQMap center={center} />
  }
}
