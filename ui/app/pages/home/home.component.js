import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import { Redirect } from 'react-router-dom'
import WalletView from '../../components/app/wallet-view'
import TransactionView from '../../components/app/transaction-view'
import ProviderApproval from '../provider-approval'
import PermissionApproval from '../permission-approval'

import {
  INITIALIZE_SEED_PHRASE_ROUTE,
  RESTORE_VAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
} from '../../helpers/constants/routes'

export default class Home extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    forgottenPassword: PropTypes.bool,
    seedWords: PropTypes.string,
    suggestedTokens: PropTypes.object,
    unconfirmedTransactionsCount: PropTypes.number,
    providerRequests: PropTypes.array,
    permissionRequests: PropTypes.array,
  }

  componentDidMount () {
    const {
      history,
      suggestedTokens = {},
      unconfirmedTransactionsCount = 0,
    } = this.props

    // suggested new tokens
    if (Object.keys(suggestedTokens).length > 0) {
        history.push(CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE)
    }

    if (unconfirmedTransactionsCount > 0) {
      history.push(CONFIRM_TRANSACTION_ROUTE)
    }
  }

  render () {
    const {
      forgottenPassword,
      seedWords,
      providerRequests,
      permissionRequests,
    } = this.props

    // seed words
    if (seedWords) {
      return <Redirect to={{ pathname: INITIALIZE_SEED_PHRASE_ROUTE }}/>
    }

    if (forgottenPassword) {
      return <Redirect to={{ pathname: RESTORE_VAULT_ROUTE }} />
    }

    if (providerRequests && providerRequests.length > 0) {
      return (
        <ProviderApproval providerRequest={providerRequests[0]} />
      )
    }

    if (permissionRequests && permissionRequests.length > 0) {
      return (
        <PermissionApproval permissionRequest={permissionRequests} />
      )
    }

    return (
      <div className="main-container">
        <div className="account-and-transaction-details">
          <Media
            query="(min-width: 576px)"
            render={() => <WalletView />}
          />
          <TransactionView />
        </div>
      </div>
    )
  }
}
