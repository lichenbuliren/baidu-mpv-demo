import React from 'react'
import BaiduMap from './components/baidu-map'

export default class App extends React.Component {
  state = {  }
  render() {
    return <BaiduMap style={{height: '100vh', width: '100vw'}} />
  }
}