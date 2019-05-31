const ObservableStore = require('obs-store')
const EventEmitter = require('safe-event-emitter')
const extend = require('xtend')

class PluginsController extends EventEmitter {

  constructor (opts = {}) {
    super()
    const initState = extend({
      plugins: {},
      pluginStates: {},
    }, opts.initState)
    this.store = new ObservableStore(initState)
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
    console.log('!!! pluginName', pluginName)
    const plugins = this.store.getState().plugins

    // if (plugins[pluginName]) {
    //   return plugins[pluginName]
    // }

    const { source, uiWrappers } = await this._getPluginConfig(pluginName)
    // create plugin

    const newPlugin = {
      handleRpcRequest: async (result, id, error) => {
        console.log('result', result)
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

    console.log('!!! this.store.getState()', this.store.getState())

    this.emit(`new-plugin`, {source: newPlugin.source, pluginName })

    return newPlugin
  }

  // Here is where we need to load requested script via ENS using EIP1577 (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1577.md),
  // example usage here: https://github.com/MetaMask/metamask-extension/pull/6402.

  async _getPluginConfig(pluginName) {
    console.log('!!! pluginName', pluginName)
    const res = await fetch('http://localhost:8888/plugin123.json')
    console.log('!!!_getPluginSource res', res)
    const json = await res.json()
    return json
  }
}

module.exports = PluginsController
