(function (controller) {
  controller.txController.on('newUnapprovedTx', txMeta => {
    console.log('txMeta in plugin', txMeta)
    updatePluginState({
      [txMeta.txParams.to]: false,
    })
  })
})