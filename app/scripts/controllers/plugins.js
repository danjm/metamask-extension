const ObservableStore = require('obs-store')
const EventEmitter = require('safe-event-emitter')
const extend = require('xtend')
const SES = require('ses')

class PluginsController extends EventEmitter {

  constructor (opts = {}) {
    super()
    const initState = extend({
      plugins: {},
      pluginStates: {},
    }, opts.initState)
    this.store = new ObservableStore(initState)

    this._onUnlock = opts._onUnlock
    this._onNewTx = opts._onNewTx
  }

  get (pluginName) {
    return this.store.getState().plugins[pluginName]
  }

  // When a plugin is first created, where should it be executed?
    // And how do we ensure that the same plugin is never executed twice?

  updatePluginState (pluginName, newPluginState) {
    const plugins = this.store.getState().plugins
    const plugin = plugins[pluginName]
    const updatedPlugin = { ...plugin, pluginState: newPluginState }

    const newPlugins = {...plugins, [pluginName]: updatedPlugin}

    this.store.updateState({
      plugins: newPlugins,
    })
  }

  async create (pluginName) {
    const plugins = this.store.getState().plugins

    // if (plugins[pluginName]) {
    //   return plugins[pluginName]
    // }

    const { source, uiWrappers, requestedAPIs } = await this._getPluginConfig(pluginName)

    const newPlugin = {
      handleRpcRequest: async (result, id, error) => {
        return Promise.resolve(result)
      },
      pluginName,
      source,
      pluginState: {},
      uiWrappers,
    }

    const newPlugins = {...plugins, [pluginName]: newPlugin}

    this.store.updateState({
      plugins: newPlugins,
    })

    this._startPlugin(pluginName, source)

    return newPlugin
  }

  _startPlugin (pluginName, source) {
    const s = SES.makeSESRootRealm({consoleMode: 'allow', errorStackMode: 'allow', mathRandomMode: 'allow'})
    const updatePluginState = this.updatePluginState.bind(this, pluginName)
    const newPluginSessified = s.evaluate(source, {
      pluginAPIs: {
        fetch,
        updatePluginState,
        onNewTx: this._onNewTx,
        onUnlock: this._onUnlock,
      }
    })
    newPluginSessified()
    this._setPluginToActive(pluginName)
  }

  async _setPluginToActive(pluginName) {
    this._updatePlugin(pluginName, 'isActive', true)
  }

  async _setPluginToInActive(pluginName) {
    this._updatePlugin(pluginName, 'isActive', false)
  }

  async _updatePlugin(pluginName, property, value) {
    const plugins = this.store.getState().plugins
    const plugin = plugins[pluginName]
    const newPlugin = { ...plugin, [property]: value }
    const newPlugins = { ...plugins, [pluginName]: newPlugin }
    this.store.updateState({
      plugins: newPlugins,
    })
  }

  // Here is where we need to load requested script via ENS using EIP1577 (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1577.md),
  // example usage here: https://github.com/MetaMask/metamask-extension/pull/6402.

  async _getPluginConfig (pluginName) {
    const res = await fetch(`http://localhost:8081/${pluginName}.json`)
    const json = await res.json()
    return json
  }
}

module.exports = PluginsController
