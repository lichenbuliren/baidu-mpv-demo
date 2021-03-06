import React from 'react'
import BaiduMap from './components/baidu-map'
import QQMap from './components/qq-map'
import data from './data'

export default class App extends React.Component {
  state = {
    center: {
      lat: 22.54071,
      lng: 113.93376
    }
  }         
  render () {
    const { center } = this.state
    // <BaiduMap center={center} data={data} style={{ height: '50vh', width: '80vw', margin: '0 auto' }} />
    return (
      <React.Fragment>
        <QQMap center={center} data={data} style={{height: '80vh', width: '80%', margin: '0 auto'}} />
      </React.Fragment>
    )
  }
}
