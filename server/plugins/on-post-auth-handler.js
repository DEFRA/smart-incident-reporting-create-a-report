import constants from '../utils/constants.js'

const onPostAuthHandler = {
  plugin: {
    name: 'on-post-auth-handler',
    register: (server, _options) => {
      server.ext('onPostAuth', async (request, h) => {
        if (request.method !== 'post') {
          return h.continue
        }

        // Only for paths where we want to recover the
        // posted payload
        if (!constants.postPayloadDataPaths.has(request.path)) {
          return h.continue
        }

        const routeAuth = request.route.settings.auth
        if (routeAuth?.mode !== 'try') {
          return h.continue
        }

        if (request.auth.isAuthenticated) {
          return h.continue
        }

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
