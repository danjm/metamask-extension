import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
const SES = require('ses')
const s = SES.makeSESRootRealm({consoleMode: 'allow', errorStackMode: 'allow', mathRandomMode: 'allow'})

export default class RecipientAddress extends PureComponent {
  static propTypes = {
    address: PropTypes.string,
    addressOnly: PropTypes.bool,
    recipientName: PropTypes.string,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  renderRecipientName (addressOnly, address, recipientName) {
    return <div className="sender-to-recipient__name">
      {
        addressOnly
          ? `${this.context.t('to')}: ${address}`
          : (recipientName || this.context.t('newContract'))
      }
    </div>
  }

  render () {
    const { address, recipientName, addressOnly, plugins, pluginWrapperId } = this.props

    const plugin = Object.values(plugins).find(plugin => plugin.uiWrappers && plugin.uiWrappers.find(uiWrapper => uiWrapper.id === pluginWrapperId))
    const uiWrapper = plugin && plugin.uiWrappers.find(uiWrapper => uiWrapper.id === pluginWrapperId)

    let UIWrappedComponent
    if (uiWrapper) {
      const uiWrapperSource = uiWrapper.wrapperSource
      const UIWrapperGenerator = s.evaluate(uiWrapperSource)
      const UIWrapper = UIWrapperGenerator(React, PureComponent)

      UIWrappedComponent = UIWrapper && UIWrapper(
        this.renderRecipientName(addressOnly, address, recipientName),
        { ...this.props, address: address.toLowerCase() },
        { pluginState: plugin.pluginState },
      )
    }

    return (uiWrapper
      ? <UIWrappedComponent />
      : (this.renderRecipientName(addressOnly, address, recipientName))
    )
  }
}
