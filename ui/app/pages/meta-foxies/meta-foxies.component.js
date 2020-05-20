import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import TextField from '../../components/ui/text-field'
import getCaretCoordinates from 'textarea-caret'
import { EventEmitter } from 'events'
import Mascot from '../../components/ui/mascot'
import foxJSON from '../../../../node_modules/metamask-logo/fox.json'
import { DEFAULT_ROUTE } from '../../helpers/constants/routes'
import METAFOXIES_ABI from './metafoxies-abi.js'
import foxColors from './foxColors'
import { Github } from 'react-color';

const chunk = function (arr, chunkSize) {
  var R = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    R.push(arr.slice(i,i+chunkSize));
  }
  return R;
}

const rgbToHex = function (rgb) { 
  let hex = Number(rgb).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
};

const fullColorHex = function(r,g,b) {   
  const red = rgbToHex(r);
  const green = rgbToHex(g);
  const blue = rgbToHex(b);
  return '#'+red+green+blue;
};

const hexToRGB = function (hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
    ]
  : null;
}

const uint256ToColorCodes = function (uint256) {
  const intsForColors = uint256.slice(0,72)
  const colorValues = intsForColors.match(/.{1,3}/g).map(Number)
  const rgbColors = chunk(colorValues, 3)
  return [
    ...rgbColors,
    [Math.floor(Math.random()*256),Math.floor(Math.random()*256),Math.floor(Math.random()*256)],
    [Math.floor(Math.random()*256),Math.floor(Math.random()*256),Math.floor(Math.random()*256)]
   ]
}

const defaultColors = Object.entries(foxJSON.chunks).map(([key, {color}]) => color)

export default class UnlockPage extends Component {
  static contextTypes = {
    metricsEvent: PropTypes.func,
    t: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object.isRequired,
    isUnlocked: PropTypes.bool,
    onImport: PropTypes.func,
    onRestore: PropTypes.func,
    onSubmit: PropTypes.func,
    forceUpdateMetamaskState: PropTypes.func,
    showOptInModal: PropTypes.func,
  }

  submitting = false

  animationEventEmitter = new EventEmitter()

  UNSAFE_componentWillMount () {
    const { selectedAddress } = this.props

    const ethContract = global.eth.contract(METAFOXIES_ABI).at('0x6e7579916fa59aB1aDb4B0a0abFEC45BC86C4FAC')

    this.setState({
      colors: defaultColors,
      currentFox: {},
      mode: 'CREATE',
      metafoxies: []
    })

    ethContract.balanceOf(selectedAddress, (error, result1) => {
      if (error) {
        throw error
      }
      const numberOfFoxes = result1[0].toNumber()

      for(let i = 0;i < numberOfFoxes; i++) {
        ethContract.tokenOfOwnerByIndex(selectedAddress, i, (error, result2) => {
          if (error) {
            throw error
          }
          this.setState({
            metafoxies: [
              ...this.state.metafoxies,
              {
                id: result2[0].toString(10),
                colors: uint256ToRGBColors(result2[0].toString(10))
              }
            ]
          })
        })
      }
    })
  }

  selectFox = (fox) => {
    console.log('fox.colors', fox.colors)
    this.setState({
      colors: fox.colors,
      currentFox: fox,
      mode: 'EDIT'
    })
  }

  render () {
    const { password, error, colors, currentFox, foxIDs, metafoxies } = this.state
    const { t } = this.context
    const { onImport, onRestore, selectFoxIcon } = this.props
    console.log('colors', colors)
    return (
      <div className="metafoxies">
        <div className="metafoxies__content">
          <div className="metafoxies__edit">
            <div className="metafoxies__mascot-container">
              <Mascot
                animationEventEmitter={this.animationEventEmitter}
                width="180"
                height="180"
                colors={colors}
              />
            </div>
           
            <div className="fox-color-squares">
              {colors.map((color, i) => {
                return <input
                  type="color"
                  className="fox-color-square"
                  value={fullColorHex(...color)}
                  onChange={event => {
                    const newColors = [...colors]
                    newColors[i] = hexToRGB(event.target.value)
                    this.setState({ colors: newColors })
                  }}
                />
              })}
            </div>

            <div className="metafoxies__controls">
              <Button
                onClick={() => {}}
                type="primary"
              >
                { this.state.mode === 'CREATE' ? 'CREATE AND BUY' : 'Update' }
              </Button>
              <Button
                onClick={() => selectFoxIcon(currentFox)}
                type="primary"
              >
                { 'Set as Icon' }
              </Button>
              <Button
                onClick={() => {}}
                type="primary"
              >
                { 'Set as color theme' }
              </Button>
              <Button
                onClick={() => {
                  this.setState({ colors: defaultColors, currentFox: {} })
                }}
                type="primary"
              >
                { 'Create New' }
              </Button>
            </div>
          </div>
          <div className="metafoxies__list">
            {
              metafoxies.map(metafoxy => {
                return (<div
                  className={`metafoxies__list-item ${currentFox.id === metafoxy.id ? 'metafoxies__selected' : ''}`}
                  onClick={() => this.selectFox(metafoxy)}
                >
                  { <Mascot
                    animationEventEmitter={this.animationEventEmitter}
                    width="60"
                    height="60"
                    followMouse={false}
                    colors={metafoxy.colors}
                  /> }
                  {/*<div className="metafoxies__list-item-name">{ metafoxy.name }</div>*/}
                </div>)
              })
            }
          </div>
        </div>
        
      </div>
    )
  }
}
