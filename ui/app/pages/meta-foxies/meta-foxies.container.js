import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'redux'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../app/scripts/lib/enums'
import { DEFAULT_ROUTE, RESTORE_VAULT_ROUTE } from '../../helpers/constants/routes'
import {
  tryUnlockMetamask,
  forgotPassword,
  markPasswordForgotten,
  forceUpdateMetamaskState,
  showModal,
  selectFoxIcon,
} from '../../store/actions'
import MetaFoxies from './meta-foxies.component'

const mapStateToProps = (state) => {
  const { metamask: { isUnlocked, selectedAddress } } = state
  return {
    isUnlocked,
    selectedAddress,
    metafoxies: [{"name":"Fox 0","id":0,"colors":[[175,212,212],[235,228,230],[149,110,55],[41,11,235],[130,120,182],[35,65,20],[107,156,86],[10,187,29],[239,125,135],[162,80,146]]},{"name":"Fox 1","id":1,"colors":[[18,75,128],[176,189,220],[152,19,51],[223,47,139],[163,248,135],[119,3,201],[218,167,35],[59,254,11],[93,128,117],[151,231,30]]},{"name":"Fox 2","id":2,"colors":[[101,141,198],[151,255,113],[110,72,127],[182,189,151],[20,51,250],[239,194,188],[69,196,246],[34,104,124],[147,156,43],[126,236,39]]},{"name":"Fox 3","id":3,"colors":[[118,3,157],[241,200,187],[94,246,246],[155,48,248],[217,184,252],[74,36,32],[8,182,198],[221,173,18],[48,72,231],[41,31,33]]},{"name":"Fox 4","id":4,"colors":[[11,191,222],[10,230,123],[189,17,84],[216,199,249],[126,158,148],[136,105,19],[137,13,230],[3,167,47],[24,4,51],[65,170,121]]},{"name":"Fox 5","id":5,"colors":[[218,166,232],[175,135,178],[224,142,206],[108,26,128],[15,185,36],[151,150,214],[243,46,137],[6,131,205],[26,248,14],[111,183,209]]},{"name":"Fox 6","id":6,"colors":[[64,219,128],[164,76,50],[192,0,222],[137,107,248],[183,200,238],[141,76,36],[170,29,200],[242,98,75],[50,141,129],[154,202,251]]}]
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    forgotPassword: () => dispatch(forgotPassword()),
    tryUnlockMetamask: (password) => dispatch(tryUnlockMetamask(password)),
    markPasswordForgotten: () => dispatch(markPasswordForgotten()),
    forceUpdateMetamaskState: () => forceUpdateMetamaskState(dispatch),
    showOptInModal: () => dispatch(showModal({ name: 'METAMETRICS_OPT_IN_MODAL' })),
    selectFoxIcon: (fox, address) => dispatch(selectFoxIcon(fox, address))
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { markPasswordForgotten, tryUnlockMetamask, ...restDispatchProps } = dispatchProps
  const { history, onSubmit: ownPropsSubmit, ...restOwnProps } = ownProps

  const onImport = async () => {
    await markPasswordForgotten()
    history.push(RESTORE_VAULT_ROUTE)

    if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
      global.platform.openExtensionInBrowser(RESTORE_VAULT_ROUTE)
    }
  }

  const onSubmit = async (password) => {
    await tryUnlockMetamask(password)
    history.push(DEFAULT_ROUTE)
  }

  return {
    ...stateProps,
    ...restDispatchProps,
    ...restOwnProps,
    onImport,
    onRestore: onImport,
    onSubmit: ownPropsSubmit || onSubmit,
    history,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps)
)(MetaFoxies)
