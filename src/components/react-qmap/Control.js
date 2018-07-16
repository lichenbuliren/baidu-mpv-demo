import BaseComponent from './BaseComponent'

export default class Control extends BaseComponent {
  componentDidMount () {
    this.initialize()
  }

  componentDidUpdate () {
    this.initialize()
  }

  componentWillUnmount () {
    this.destory()
  }

  initialize = () => {
    const { map } = this.props
    if (!map) return
    this.destory()
    this.control = this.getControl()
  }

  destory () {
    const { map } = this.props
    const options = this.getOptions(this.options)
    if (!map || !this.control) return
    map.controls[options.position].elems.splice(this.control.index + 1, 1)
  }

  getControl () {
    return null
  }
}
