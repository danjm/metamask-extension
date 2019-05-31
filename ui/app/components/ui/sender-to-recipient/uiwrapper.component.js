import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

const divStyle = {
  display: 'flex',
}
const spanStyle = {
  'margin-left': '10px',
  'margin-top': '-3px',
  'font-size': '18px',
  'font-weight': '900',
  color: 'red',
}

export default function UIWrapper (WrappedComponent, props, plugin) {
  return class UIWrappedComponent extends PureComponent {
    render () {
      const checkedAddresses = plugin && plugin.pluginState
      const wrapWithWarning = checkedAddresses[props.address && props.address.toLowerCase()]

      return (wrapWithWarning
        ? <div style={divStyle}>
            { WrappedComponent }
            <span style={spanStyle}>!</span>
          </div>
        : <div>{ WrappedComponent }</div>
      )
    }
  }
}
