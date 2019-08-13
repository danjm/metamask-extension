const JsonRpcEngine = require('json-rpc-engine')
const asMiddleware = require('json-rpc-engine/src/asMiddleware')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const RpcCap = require('json-rpc-capabilities-middleware').CapabilitiesController
const uuid = require('uuid/v4')

const pluginApiDescriptionMap = {
  onNewTx: 'Take action whenever a new transaction is created',
  fetch: 'Retrieve data from external sites',
  updatePluginState: 'Store data locally',
  onUnlock: 'Take action when you unlock your account',
  Box: 'Backup your data to 3Box',
  subscribeToPreferencesControllerChanges: 'Access your preferences and take action when they change',
  updatePreferencesControllerState: 'Update/modify your preferences',
  generateSignature: 'Sign messages with your account',
}

// Methods that do not require any permissions to use:
const SAFE_METHODS = require('../lib/permissions-safe-methods.json')

// class PermissionsController extends SafeEventEmitter {
class PermissionsController {

  constructor ({
    openPopup, closePopup, keyringController, pluginsController,
  } = {}, restoredState) {
    this._openPopup = openPopup
    this._closePopup = closePopup
    this.keyringController = keyringController
    this._initializePermissions(restoredState)
    this.engines = {} // { origin: middleware } map for selectedAddress compatibility
    this.pluginsController = pluginsController
  }

  createMiddleware (options) {
    const { origin } = options
    const engine = new JsonRpcEngine()
    engine.push(this.createRequestMiddleware(options))
    engine.push(this.permissions.providerMiddlewareFunction.bind(
      this.permissions, { origin }
    ))
    this.engines[origin] = engine
    return asMiddleware(engine)
    // return this.permissions.providerMiddlewareFunction.bind(this.permissions, { origin })
  }

  /**
     * Create middleware for preprocessing permissions requests.
   * @param {origin: string, getSiteMetadata: function} options middleware options
   */
  createRequestMiddleware ({ getSiteMetadata }) {
    return createAsyncMiddleware(async (req, res, next) => {

      // backwards compatibility: treat eth_requestAccounts as eth_accounts
      if (req.method === 'eth_requestAccounts') req.method = 'eth_accounts'

      // terminate requests if MetaMask is not unlocked
      if (!this.keyringController.memStore.getState().isUnlocked) {
        if (req.method === 'eth_accounts') {
          // eth_accounts returns empty array for backwards compatibility
          res.result = []
          return
        }
        // TODO:lps:review how handle?
        // We want to terminate requests here, and this produces a "MetaMask - RPC Error"
        // error on the web page, but I can't tell where the message comes from.
        // The message is: "An unauthorized action was attempted."
        res.error = { code: 1, message: 'Access denied.' } // this does not appear to go anywhere
        return
      }

      // add metadata to permissions requests
      if (
        req.method === 'wallet_requestPermissions' &&
        Array.isArray(req.params)
      ) {

        /**
         * TODO:lps:review
         * This is to ensure that the request's params array has a single item,
         * the permissions array. We then (const metadata = { ... }) add a metadata
         * parameter to the end of the params array, which is ultimately used in the UI
         * to populate the popup with the site title and icon.
         */
        // some input validation
        if (req.params.length !== 1) throw new Error('Bad request.')

        // add unique id and site metadata to request params
        const metadata = {
          metadata: {
            id: uuid(),
            site: await getSiteMetadata(),
          },
        }

        const pluginPermissionNames = Object.keys(req.params[0])
          .filter(key => key.match(/^eth_plugin_(.+)/))
          .map(key => key.match(/^eth_plugin_(.+)/)[1])

        if (pluginPermissionNames.length) {
          const pluginPermissionRequestedAPIs = await Promise.all(
            pluginPermissionNames.map(pluginName => {
              return fetch(`http://localhost:8081/${pluginName}.json`)
                .then(res => res.json())
                .then(({ requestedAPIs }) => {
                  return {
                    pluginName,
                    requestedAPIDescriptions: requestedAPIs.map(n => pluginApiDescriptionMap[n]),
                  }
                })
            }))

          pluginPermissionRequestedAPIs.forEach(({ pluginName, requestedAPIDescriptions }) => {
            req.params[0]['eth_plugin_' + pluginName]['requestedAPIDescriptions'] = requestedAPIDescriptions
          })

        }

        req.params.push(metadata)
      }

      return next()
    })
  }
/**
   * Returns whether accounts should be exposed.
   * @param {string} origin
   */
  async shouldExposeAccounts (origin) {
    return new Promise((resolve, reject) => {
      // TODO:lps:review how handle? This will happen when permissions are cleared
      if (!this.engines[origin]) reject(new Error('Unknown origin: ${origin}'))
      this.engines[origin].handle(
        { method: 'eth_accounts' },
        (err, res) => {
          if (err || res.error || !Array.isArray(res.result)) {
            resolve(false)
          } else {
            resolve(true)
          }
        }
      )
    })
  }

  /**
   * Returns the accounts that should be exposed for the given origin domain,
   * if any.
   * @param {string} origin
   */
  async getAccounts (origin) {
    return new Promise((resolve, reject) => {
      // TODO:lps:review how handle? This will happen when permissions are cleared
      if (!this.engines[origin]) reject(new Error('Unknown origin: ${origin}'))
      this.engines[origin].handle(
        { method: 'eth_accounts' },
        (err, res) => {
          if (err || res.error || !Array.isArray(res.result)) {
            resolve([])
          } else {
            resolve(res.result)
          }
        }
      )
    })
  }

  /**
   * Removes all known domains their related permissions.
   */
  clearPermissions () {
    this.permissions.clearDomains()
    Object.keys(this.engines).forEach(s => {
      delete this.engines[s]
    })
  }

  /**
   * User approval callback.
   * @param {object} approved the approved request object
   */
  async approvePermissionsRequest (approved) {
    const { id } = approved.metadata
    const approval = this.pendingApprovals[id]
    const res = approval.res
    res(approved.permissions)
    this._closePopup && this._closePopup()
    delete this.pendingApprovals[id]
    console.log('this.pendingApprovals', this.pendingApprovals)
  }

  /**
   * User rejection callback.
   * @param {string} id the id of the rejected request
   */
  async rejectPermissionsRequest (id) {
    const approval = this.pendingApprovals[id]
    const rej = approval.rej
    rej(false)
    this._closePopup && this._closePopup()
    delete this.pendingApprovals[id]
  }

  /**
   * A convenience method for retrieving a login object
   * or creating a new one if needed.
   *
   * @param {string} origin = The origin string representing the domain.
   */
  _initializePermissions (restoredState) {
    this.testProfile = {
      name: 'Dan Finlay',
    }

    this.pendingApprovals = {}

    this.permissions = new RpcCap({

      // Supports passthrough methods:
      safeMethods: SAFE_METHODS,

      // optional prefix for internal methods
      methodPrefix: 'wallet_',

      restrictedMethods: {

        'eth_accounts': {
          description: 'View Ethereum accounts',
          method: (_, res, __, end) => {
            this.keyringController.getAccounts()
            .then((accounts) => {
              res.result = accounts
              // TODO:lps:review
              // This used to call next, but that does not produce the expected behavior.
              // The only two subsequent middlewares (watchAsset and the primary provider)
              // should have no work to complete at this point.
              end()
            })
            .catch((reason) => {
              res.error = reason
              end(reason)
            })
          },
        },

        // Restricted methods themselves are defined as
        // json-rpc-engine middleware functions.
        'readYourProfile': {
          description: 'Read from your profile',
          method: (_req, res, _next, end) => {
            res.result = this.testProfile
            console.log('!!!!!!!!!!!!!!!!!!', 1111)
            end()
          },
        },
        'writeToYourProfile': {
          description: 'Write to your profile.',
          method: (req, res, _next, end) => {
            const [ key, value ] = req.params
            this.testProfile[key] = value
            res.result = this.testProfile
            return end()
          },
        },
        'eth_plugin_': {
          description: 'Connect with plugin $1, which will run a script in the background of your MetaMask.',
          method: createAsyncMiddleware(async (req, res, next, end) => {
            console.log('!!!!! req', req)
            const pluginNameMatch = req.method.match(/eth_plugin_(.+)/)
            console.log('!!!!! pluginNameMatch', pluginNameMatch)
            const pluginName = pluginNameMatch && pluginNameMatch[1]
            console.log('!!!!! pluginNameMatch', pluginNameMatch)

            let plugin

            if (!plugin) {
              plugin = await this.pluginsController.create(pluginName)
            }

            res.result = plugin
            return await plugin.handleRpcRequest(req.params[0])
          }),
        },
      },

      /**
       * A promise-returning callback used to determine whether to approve
       * permissions requests or not.
       *
       * Currently only returns a boolean, but eventually should return any specific parameters or amendments to the permissions.
       *
       * @param {string} domain - The requesting domain string
       * @param {string} req - The request object sent in to the `requestPermissions` method.
       * @returns {Promise<bool>} approved - Whether the user approves the request or not.
       */
      requestUserApproval: async (options) => {
        const { metadata } = options
        const { id } = metadata

        this._openPopup && this._openPopup()

        return new Promise((res, rej) => {
          this.pendingApprovals[id] = { res, rej }
        },
        // TODO: This should be persisted/restored state.
        {})

        // TODO: Attenuate requested permissions in approval screen.
        // Like selecting the account to display.
      },
    }, restoredState)
  }

}

module.exports = PermissionsController
