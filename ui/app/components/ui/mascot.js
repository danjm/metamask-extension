import PropTypes from 'prop-types'
import React, { createRef, Component } from 'react'
import metamaskLogo from 'metamask-logo'
import { debounce } from 'lodash'

export default class Mascot extends Component {
  static propTypes = {
    animationEventEmitter: PropTypes.object.isRequired,
    width: PropTypes.string,
    height: PropTypes.string,
  }

  constructor (props) {
    super(props)

    const { width = '200', height = '200' } = props
    const followMouse = props.followMouse === undefined ? true : props.followMouse
    console.log('props', props)
    this.logo = metamaskLogo({
      followMouse,
      pxNotRatio: true,
      width,
      height,
      colors: props.colors
    })

    this.mascotContainer = createRef()

    this.refollowMouse = debounce(this.logo.setFollowMouse.bind(this.logo, true), 1000)
    this.unfollowMouse = this.logo.setFollowMouse.bind(this.logo, false)
  }

  handleAnimationEvents () {
    // only setup listeners once
    if (this.animations) {
      return
    }
    this.animations = this.props.animationEventEmitter
    this.animations && this.animations.on('point', this.lookAt.bind(this))
    this.animations && this.animations.on('setFollowMouse', this.logo.setFollowMouse.bind(this.logo))
  }

  lookAt (target) {
    this.unfollowMouse()
    this.logo.lookAt(target)
    this.refollowMouse()
  }

  componentDidMount () {
    this.mascotContainer.current.appendChild(this.logo.container)
  }

  componentWillUnmount () {
    this.animations = this.props.animationEventEmitter
    this.animations && this.animations.removeAllListeners()
    this.logo.container.remove()
    this.logo.stopAnimation()
  }

  componentDidUpdate (prevProps) {
    if (JSON.stringify(prevProps.colors) !== JSON.stringify(this.props.colors)) {
      this.logo.reRender(this.props.colors)
    }
  }

  render () {
    // this is a bit hacky
    // the event emitter is on `this.props`
    // and we dont get that until render
    this.handleAnimationEvents()
    return (
      <div
        ref={this.mascotContainer}
        style={{ zIndex: 0 }}
      />
    )
  }
}
