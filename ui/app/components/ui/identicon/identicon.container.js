import { connect } from 'react-redux'
import Identicon from './identicon.component'

const mapStateToProps = (state) => {
  const { metamask: { useBlockie, selectedFox } } = state

  return {
    useBlockie,
    useFox: Boolean(selectedFox),
    foxColors: selectedFox && selectedFox.colors,
  }
}

export default connect(mapStateToProps)(Identicon)
