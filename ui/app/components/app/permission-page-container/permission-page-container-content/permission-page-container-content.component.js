import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import Identicon from '../../../ui/identicon'

export default class PermissionPageContainerContent extends PureComponent {
  static propTypes = {
    request: PropTypes.array.isRequired,
    selectedIdentity: PropTypes.object.isRequired,
    permissionsDescriptions: PropTypes.array.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  };

  renderConnectVisual = () => {
    const { request: requests, selectedIdentity } = this.props
    const { origin, metadata: { siteImage, siteTitle } } = requests[0]

    return (
      <div className="permission-approval-visual">
        <section>
          {siteImage ? (
            <img
              className="permission-approval-visual__identicon"
              src={siteImage}
            />
          ) : (
            <i className="permission-approval-visual__identicon--default">
              {siteTitle.charAt(0).toUpperCase()}
            </i>
          )}
          <h1>{siteTitle}</h1>
          <h2>{origin}</h2>
        </section>
        <span className="permission-approval-visual__check" />
        <section>
          <Identicon
            className="permission-approval-visual__identicon"
            address={selectedIdentity.address}
            diameter={64}
          />
          <h1>{selectedIdentity.name}</h1>
        </section>
      </div>
    )
  }

  renderRequestedPermissions () {
    console.log('this.props', this.props)
    const { request: requests, permissionsDescriptions } = this.props
    const options = requests.map(request => request.options.method)
    const { t } = this.context
    const optsArr = Object.values(options)
    console.log('optsArr', optsArr)
    const items = optsArr.map((funcName) => {
      const matchingFuncs = permissionsDescriptions.filter(perm => perm.method === funcName)
      const match = matchingFuncs[0]
      if (!match) {
        throw new Error('Requested unknown permission.')
      }
      return (
        <li
          className="permission-requested"
          key={funcName}
          >
          {match.description}
        </li>
      )
    })

    return (
      <ul className="permissions-requested">
        <h4>{t('permissionsRequest')}</h4>
        {items}
      </ul>
    )
  }

  render () {
    console.log('render this.props', this.props)
    const { request } = this.props
    const { siteTitle } = request
    const { t } = this.context

    return (
      <div className="permission-approval-container__content">
        <section>
          <h2>{t('connectRequest')}</h2>
          {this.renderConnectVisual()}
          <h1>{t('permissionRequest', [siteTitle])}</h1>
          <p>
            <br/>
            {this.renderRequestedPermissions()}
            <br/>
            <a
              href="https://medium.com/metamask/introducing-privacy-mode-42549d4870fa"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('learnMore')}.
            </a>
          </p>
        </section>
        <section className="secure-badge">
          <img src="/images/mm-secure.svg" />
        </section>
      </div>
    )
  }
}
