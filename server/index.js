import Hapi from '@hapi/hapi'
import config from './utils/config.js'
import Blipp from 'blipp'
import errorPages from './plugins/error-pages.js'
import inert from './plugins/inert.js'
import router from './plugins/router.js'
import views from './plugins/views.js'
import cache from './plugins/cache.js'
import logging from './plugins/logging.js'
import session from './plugins/session.js'
import auth from './plugins/auth.js'
import onPostHandler from './plugins/on-post-handler.js'

const createServer = async options => {
  // Create the hapi server
  options = {
    ...{
      port: config.servicePort,
      routes: {
        validate: {
          options: {
            abortEarly: false
          }
        },
        cors: true,
        security: true
      },
      cache
    },
    ...options
  }
  return new Hapi.Server(options)
}

const init = async server => {
  await _registerPlugins(server)

  // FIXME: reused values from session plugin, should be in config
  server.app.tokenCache = server.cache({
    cache: 'redis_cache', 
    segment: 'tokens', // FIXME: this should be in config
    expiresIn:  24 * 60 * 60 * 1000 // FIXME: want this to be longer and/or match the cookie ttl?
  })

  await server.start()
}

const _registerPlugins = async server => {
  await server.register(logging)
  await server.register(session)
  await server.register(auth)
  await server.register(errorPages)
  await server.register(inert)
  await server.register(await router())
  await server.register(views)
  await server.register(Blipp)
  await server.register(onPostHandler)
}

export { createServer, init }
