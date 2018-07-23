/* global qq, QQMapPlugin */
import React from 'react'

export default class GridHeatmap extends Component {
  static defaultProps = {
    grident: {
      0.25: "rgba(0, 0, 255, 1)",
      0.55: "rgba(0, 255, 0, 1)",
      0.85: "rgba(255, 255, 0, 1)",
      1.0: "rgba(255, 0, 0, 1)"
    },
    data: [],
    valueField: 'count'
  }


  componentDidMount () {
    this.initial()
  }

  initial = () => {
    
  }

  render() {
    return null
  }
}