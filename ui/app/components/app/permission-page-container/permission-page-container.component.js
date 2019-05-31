import PropTypes from 'prop-types'
import React, {PureComponent} from 'react'
import { PermissionPageContainerContent, PermissionPageContainerHeader } from '.'
import { PageContainerFooter } from '../../ui/page-container'

export default class PermissionPageContainer extends PureComponent {
  static propTypes = {
    approvePermissionRequest: PropTypes.func.isRequired,
    rejectPermissionRequest: PropTypes.func.isRequired,
    request: PropTypes.array.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  componentDidMount () {
    this.context.metricsEvent({
      eventOpts: {
        category: 'Auth',
        action: 'Connect',
        name: 'Popup Opened',
      },
    })
  }

  onCancel = () => {
    const { request: requests, rejectPermissionRequest } = this.props
    const { id } = requests[0].metadata
    rejectPermissionRequest(id)
  }

  onSubmit = () => {
    const { request: requests, approvePermissionRequest } = this.props
    console.log('onSubmit requests', requests)
    const { id } = requests[0].metadata
    approvePermissionRequest(id)
  }

  render () {
    const { request: requests } = this.props
    const { origin, metadata: { siteImage, siteTitle } } = requests[0]

    return (
      <div className="page-container permission-approval-container">
        <PermissionPageContainerHeader />
        <PermissionPageContainerContent
          request={requests}
          origin={origin}
          siteImage={siteImage}
          siteTitle={siteTitle}
        />
        <PageContainerFooter
          onCancel={() => this.onCancel()}
          cancelText={this.context.t('cancel')}
          onSubmit={() => this.onSubmit()}
          submitText={this.context.t('connect')}
          submitButtonType="confirm"
        />
      </div>
    )
  }
}
