import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import contractMap from 'eth-contract-metadata'

import BlockieIdenticon from './blockieIdenticon'
import { checksumAddress } from '../../../helpers/utils/util'
import Jazzicon from '../jazzicon'
import Mascot from '../mascot'

const hexToRGB = function (hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
    ]
   : null;
}
const hexColorsToRGB = colors => colors.map(color => hexToRGB(color))


const getStyles = (diameter) => (
  {
    height: diameter,
    width: diameter,
    borderRadius: diameter / 2,
  }
)

export default class Identicon extends PureComponent {
  static propTypes = {
    addBorder: PropTypes.bool,
    address: PropTypes.string,
    className: PropTypes.string,
    diameter: PropTypes.number,
    image: PropTypes.string,
    useBlockie: PropTypes.bool,
  }

  static defaultProps = {
    addBorder: false,
    address: undefined,
    className: undefined,
    diameter: 46,
    image: undefined,
    useBlockie: false,
  }

  renderImage () {
    const { className, diameter, image } = this.props

    return (
      <img
        className={classnames('identicon', className)}
        src={image}
        style={getStyles(diameter)}
      />
    )
  }

  renderJazzicon () {
    const { address, className, diameter } = this.props

    return (
      <Jazzicon
        address={address}
        diameter={diameter}
        className={classnames('identicon', className)}
        style={getStyles(diameter)}
      />
    )
  }

  renderBlockie () {
    const { address, className, diameter } = this.props

    return (
      <div
        className={classnames('identicon', className)}
        style={getStyles(diameter)}
      >
        <BlockieIdenticon
          address={address}
          diameter={diameter}
        />
      </div>
    )
  }

  foxIcon () {
    return (<Mascot
      width={this.props.diameter}
      height={this.props.diameter}
      colors={hexColorsToRGB(this.props.foxColors)}
      followMouse={true}
    />)
  }

  renderIcon () {
    if (this.props.useBlockie) {
      return this.renderBlockie()
    } else if (this.props.useFox) {
      return this.foxIcon()
    } else {
      return this.renderJazzicon()
    }
  }

  render () {
    const { className, address, image, diameter, useBlockie, addBorder, useFox } = this.props

    if (image) {
      return this.renderImage()
    }

    if (address) {
      const checksummedAddress = checksumAddress(address)

      if (contractMap[checksummedAddress] && contractMap[checksummedAddress].logo) {
        return this.renderJazzicon()
      }

      return (
        <div className={classnames({ 'identicon__address-wrapper': addBorder, 'identicon__fox': useFox })}>
          { this.renderIcon() }
        </div>
      )
    }

    return (
      <img
        className={classnames('balance-icon', className)}
        src="./images/eth_logo.svg"
        style={getStyles(diameter)}
      />
    )
  }
}
