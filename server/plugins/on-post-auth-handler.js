import constants from '../utils/constants.js'

const onPostAuthHandler = {
  plugin: {
    name: 'on-post-auth-handler',
    register: (server, _options) => {
      server.ext('onPostAuth', async (request, h) => {
        if (request.method !== 'post') {
          return h.continue
        }

        // HOME route handles azure auth, this handler is for
        // capturing session state lost by cookie auth
        if (request.path === constants.routes.HOME) {
          return h.continue
        }

        // Only for paths where we want to recover the
        // posted payload
        console.log('---------------')
        console.log(request.path)
        console.log(constants.postPayloadDataPaths)
        console.log('---------------')

        if (!constants.postPayloadDataPaths.has(request.path)) {
          return h.continue
        }

        console.log('----> In POST AUTH')
        const routeAuth = request.route.settings.auth
        if (!routeAuth || routeAuth.mode !== 'try') {
          console.log('----> Not a try mode route, doing nothing')
          return h.continue
        }

        if (request.auth.isAuthenticated) {
          console.log('----> Authenticated, doing nothing')
          return h.continue
        }

        console.log('----> here is the payload to capture:')
        console.log(request.payload)

        const payload = request.payload
        request.yar.set(constants.redisKeys.POST_DATA_RECOVERY, {
          path: request.path,
          payload
        })

        return h.redirect('/').takeover()
      })
    }
  }
}

export default onPostAuthHandler
