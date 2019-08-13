import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import Identicon from '../../../ui/identicon'
import AccountDropdownMini from '../../../ui/account-dropdown-mini'

export default class PermissionPageContainerContent extends PureComponent {
  static propTypes = {
    requests: PropTypes.array.isRequired,
    selectedAccount: PropTypes.object.isRequired,
    permissionsDescriptions: PropTypes.array.isRequired,
    onAccountSelect: PropTypes.func.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  };

  renderConnectVisual = () => {
    const { requests, selectedAccount, onAccountSelect } = this.props
    const { origin, site } = requests[0].metadata

    // const { t } = this.context

    return (
      <div className="permission-approval-visual">
        <section>
          {site.icon ? (
            <img
              className="permission-approval-visual__identicon"
              src={site.icon}
            />
          ) : (
            <i className="permission-approval-visual__identicon--default">
              {site.name.charAt(0).toUpperCase()}
            </i>
          )}
          <h1>{site.name}</h1>
          <h2>{origin}</h2>
        </section>
        <span className="permission-approval-visual__check" />
        <section>
          <Identicon
            className="permission-approval-visual__identicon"
            address={selectedAccount.address}
            diameter={64}
          />
          <AccountDropdownMini
            className="permission-approval-container__content"
            onSelect={onAccountSelect}
            selectedAccount={selectedAccount}
          />
        </section>
      </div>
    )
  }

  renderRequestedPermissions () {
    const { requests, permissionsDescriptions } = this.props

    const request = requests[0]

    const requestedMethods = Object.keys(request.permissions)

    const items = requestedMethods.map((methodName) => {
      console.log('!!!! permissionsDescriptions', permissionsDescriptions)
      console.log('!!!! methodName', methodName)
      const match = permissionsDescriptions.find((perm) => {
        return perm.method === methodName || (methodName.match(/^eth_plugin_[A-z0-9]+/) && perm.method === 'eth_plugin_')
      })


      if (!match) {
        throw new Error('Requested unknown permission: ' + methodName)
      }

      let description = match.description
      let renderedName = methodName
      let requestedAPIDescriptions

      const isPluginRequest = (methodName.match(/^eth_plugin_[A-z0-9]+/) && match.method === 'eth_plugin_')
      if (isPluginRequest) {
        renderedName = methodName.match(/^eth_plugin_([A-z0-9]+)/)[1]
        description = description.replace('$1', renderedName)
        requestedAPIDescriptions = request.permissions[methodName].requestedAPIDescriptions
      }

      return (
        <li
          className="permission-requested"
          key={renderedName}
          >
          {description}
          { isPluginRequest && 'This plugin will be able to:' }
          {
            isPluginRequest && (
              <ul>
                { requestedAPIDescriptions.map(apiDescription => <li className="permission-requested__sub-permission">- { apiDescription }</li>) }
              </ul>
            )
          }
        </li>
      )
    })

    return (
      <ul className="permissions-requested">
        {items}
      </ul>
    )
  }

  render () {
    const { requests } = this.props
    const { site } = requests[0].metadata
    const { t } = this.context

    return (
      <div className="permission-approval-container__content">
        <section>
          <h2>{t('connectRequest')}</h2>
          {this.renderConnectVisual()}
          <section>
            <h1>{site.name}</h1>
            <h2>{'Would like to:'}</h2>
            {this.renderRequestedPermissions()}
            <br/>
            <a
              href="https://medium.com/metamask/introducing-privacy-mode-42549d4870fa"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('learnMore')}.
            </a>
          </section>
        </section>
        <section className="secure-badge">
          <img src="/images/mm-secure.svg" />
        </section>
      </div>
    )
  }
}
