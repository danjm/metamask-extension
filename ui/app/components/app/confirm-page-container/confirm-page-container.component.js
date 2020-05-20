import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SenderToRecipient from '../../ui/sender-to-recipient'
import Mascot from '../../ui/mascot'
import { PageContainerFooter } from '../../ui/page-container'
import { ConfirmPageContainerHeader, ConfirmPageContainerContent, ConfirmPageContainerNavigation } from '.'
import BigNumber from 'bignumber.js'
import foxColors from '../../../pages/meta-foxies/fox-colors'
console.log('foxColors', foxColors)
const uint256ToColors = function (uint256) {
  const intsForColors = uint256.slice(0,30)
  const colors = intsForColors.match(/.{1,3}/g)
    .map(n => foxColors[Number(n) - 100])
  return colors
}

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

const getColorsFromTxData = (data, fromAddress) => {
  const dataParts = data.split(fromAddress.slice(2))
  const id = dataParts && dataParts[1] && dataParts[1].match(/^0+(.+)/)[1]
  console.log('id', id)
  if (id) {
    const colourNumbers = (new BigNumber(id, 16)).toString(10)
    console.log('colourNumbers', colourNumbers)
    console.log('uint256ToColors(colourNumbers)', uint256ToColors(colourNumbers))
    const t = hexColorsToRGB(uint256ToColors(colourNumbers))
    console.log('!!!t', t)
    return t
  } else {
    return null
  }
} 

export default class ConfirmPageContainer extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    // Header
    action: PropTypes.string,
    hideSubtitle: PropTypes.bool,
    onEdit: PropTypes.func,
    showEdit: PropTypes.bool,
    subtitle: PropTypes.string,
    subtitleComponent: PropTypes.node,
    title: PropTypes.string,
    titleComponent: PropTypes.node,
    hideSenderToRecipient: PropTypes.bool,
    showAccountInHeader: PropTypes.bool,
    // Sender to Recipient
    fromAddress: PropTypes.string,
    fromName: PropTypes.string,
    toAddress: PropTypes.string,
    toName: PropTypes.string,
    toEns: PropTypes.string,
    toNickname: PropTypes.string,
    // Content
    contentComponent: PropTypes.node,
    errorKey: PropTypes.string,
    errorMessage: PropTypes.string,
    dataComponent: PropTypes.node,
    detailsComponent: PropTypes.node,
    identiconAddress: PropTypes.string,
    nonce: PropTypes.string,
    assetImage: PropTypes.string,
    summaryComponent: PropTypes.node,
    warning: PropTypes.string,
    unapprovedTxCount: PropTypes.number,
    // Navigation
    totalTx: PropTypes.number,
    positionOfCurrentTx: PropTypes.number,
    nextTxId: PropTypes.string,
    prevTxId: PropTypes.string,
    showNavigation: PropTypes.bool,
    onNextTx: PropTypes.func,
    firstTx: PropTypes.string,
    lastTx: PropTypes.string,
    ofText: PropTypes.string,
    requestsWaitingText: PropTypes.string,
    // Footer
    onCancelAll: PropTypes.func,
    onCancel: PropTypes.func,
    onSubmit: PropTypes.func,
    disabled: PropTypes.bool,
  }

  renderMetaFoxy () {
    // return null
    return (
      <Mascot
        width="60"
        height="60"
        followMouse={false}
        colors={getColorsFromTxData(this.props.transactionData, this.props.fromAddress)}
      />
    )
  }

  render () {
    const {
      showEdit,
      onEdit,
      fromName,
      fromAddress,
      toName,
      toEns,
      toNickname,
      toAddress,
      disabled,
      errorKey,
      errorMessage,
      contentComponent,
      action,
      title,
      titleComponent,
      subtitle,
      subtitleComponent,
      hideSubtitle,
      summaryComponent,
      detailsComponent,
      dataComponent,
      onCancelAll,
      onCancel,
      onSubmit,
      identiconAddress,
      nonce,
      unapprovedTxCount,
      assetImage,
      warning,
      totalTx,
      positionOfCurrentTx,
      nextTxId,
      prevTxId,
      showNavigation,
      onNextTx,
      firstTx,
      lastTx,
      ofText,
      requestsWaitingText,
      hideSenderToRecipient,
      showAccountInHeader,
    } = this.props
    const renderAssetImage = contentComponent || (!contentComponent && !identiconAddress)
    const isMetaFoxyBuy = toAddress.toLowerCase() === ('0x9A75D5d456B5183EC4eaa7a4f21ad70063475599').toLowerCase()

    return (
      <div className="page-container">
        <ConfirmPageContainerNavigation
          totalTx={totalTx}
          positionOfCurrentTx={positionOfCurrentTx}
          nextTxId={nextTxId}
          prevTxId={prevTxId}
          showNavigation={showNavigation}
          onNextTx={(txId) => onNextTx(txId)}
          firstTx={firstTx}
          lastTx={lastTx}
          ofText={ofText}
          requestsWaitingText={requestsWaitingText}
        />
        <ConfirmPageContainerHeader
          showEdit={showEdit}
          onEdit={() => onEdit()}
          showAccountInHeader={showAccountInHeader}
          accountAddress={fromAddress}
        >
          { hideSenderToRecipient
            ? null
            : (
              <SenderToRecipient
                senderName={fromName}
                senderAddress={fromAddress}
                recipientName={toName}
                recipientAddress={toAddress}
                recipientEns={toEns}
                recipientNickname={toNickname}
                assetImage={renderAssetImage ? assetImage : undefined}
              />
            )
          }
        </ConfirmPageContainerHeader>
        {
          contentComponent || (
            <ConfirmPageContainerContent
              action={isMetaFoxyBuy ? 'BUY METAFOXY' : action}
              title={title}
              titleComponent={titleComponent}
              subtitle={subtitle}
              subtitleComponent={subtitleComponent}
              hideSubtitle={hideSubtitle}
              summaryComponent={summaryComponent}
              detailsComponent={detailsComponent}
              dataComponent={dataComponent}
              errorMessage={errorMessage}
              errorKey={errorKey}
              identiconAddress={identiconAddress}
              nonce={nonce}
              assetImage={assetImage}
              FoxImage={isMetaFoxyBuy ? () => this.renderMetaFoxy() : null}
              warning={warning}
            />
          )
        }
        <PageContainerFooter
          onCancel={() => onCancel()}
          cancelText={this.context.t('reject')}
          onSubmit={() => onSubmit()}
          submitText={this.context.t('confirm')}
          submitButtonType="confirm"
          disabled={disabled}
        >
          {unapprovedTxCount > 1 && (
            <a onClick={() => onCancelAll()}>
              {this.context.t('rejectTxsN', [unapprovedTxCount])}
            </a>
          )}
        </PageContainerFooter>
      </div>
    )
  }
}
