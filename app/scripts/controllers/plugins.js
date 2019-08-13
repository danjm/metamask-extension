const ObservableStore = require('obs-store')
const EventEmitter = require('safe-event-emitter')
const extend = require('xtend')
const SES = require('ses')
const Box = require('3box/dist/3box.min')

class PluginsController extends EventEmitter {

  constructor (opts = {}) {
    super()
    const initState = extend({
      plugins: {},
      pluginStates: {},
    }, opts.initState)
    this.store = new ObservableStore(initState)

    this.setupProvider = opts.setupProvider
    console.log('!!!!! opts', opts)
    this._onUnlock = opts._onUnlock
    this._onNewTx = opts._onNewTx
    this._subscribeToPreferencesControllerChanges = opts._subscribeToPreferencesControllerChanges
    this._updatePreferencesControllerState = opts._updatePreferencesControllerState
    this._signPersonalMessage = opts._signPersonalMessage
    this._getAccounts = opts._getAccounts
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
    const accounts = await this._getAccounts()
    console.log('!!!!!* p accounts', accounts)
    const address = accounts[0]

    const newPlugin = {
      handleRpcRequest: async (result) => {
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

    this._startPlugin(pluginName, source, requestedAPIs, address)

    return newPlugin
  }

  _generateApisToProvide (apiList, pluginName) {
    const updatePluginState = this.updatePluginState.bind(this, pluginName)
    const possibleApis = {
      fetch,
      updatePluginState,
      onNewTx: this._onNewTx,
      onUnlock: this._onUnlock,
      Box,
      subscribeToPreferencesControllerChanges: this._subscribeToPreferencesControllerChanges,
      updatePreferencesControllerState: this._updatePreferencesControllerState,
      generateSignature: (text, address) => {
        const msg = '0x' + Buffer.from(text, 'utf8').toString('hex')

        return this._signPersonalMessage({
          from: address,
          data: msg,
        })
      }
    }
    const apisToProvide = {}
    apiList.forEach(apiKey => {
      apisToProvide[apiKey] = possibleApis[apiKey]
    })
    return apisToProvide
  }

  _startPlugin (pluginName, source, requestedAPIs, address) {
    const s = SES.makeSESRootRealm({consoleMode: 'allow', errorStackMode: 'allow', mathRandomMode: 'allow'})
    const newPluginSessified = s.evaluate(source, {
      pluginAPIs: this._generateApisToProvide(requestedAPIs, pluginName),
      pluginData: {
        address,
      },
      ethereumProvider: this.setupProvider(pluginName, async () => { return {name: pluginName } }),
    })
    newPluginSessified()
    this._setPluginToActive(pluginName)
  }

  async _setPluginToActive (pluginName) {
    this._updatePlugin(pluginName, 'isActive', true)
  }

  async _setPluginToInActive (pluginName) {
    this._updatePlugin(pluginName, 'isActive', false)
  }

  async _updatePlugin (pluginName, property, value) {
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
    console.log('!!! _getPluginConfig pluginName', pluginName)
    const res = await fetch(`http://localhost:8081/${pluginName}.json`)
    console.log('!!! _getPluginConfig res', res)
    const json = await res.json()
    console.log('!!! _getPluginConfig json', json)
    return json
  }
}

module.exports = PluginsController
