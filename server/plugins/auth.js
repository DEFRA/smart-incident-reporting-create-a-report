import Cookie from '@hapi/cookie'
import Bell from '@hapi/bell'
import config from '../utils/config.js'

const auth = {
  name: 'auth',
  register: async (server, _options) => {
    await server.register(Cookie)
    await server.register(Bell)

    server.auth.strategy('azure-auth', 'bell', {
      provider: 'azure',
      clientId: config.aadClientId,
      clientSecret: config.aadClientSecret,
      password: config.authCookiePassword,
      config: {
        tenant: config.aadTenant
      }
    })

    server.auth.strategy('session-auth', 'cookie', {
      cookie: {
        path: '/',
        password: config.authCookiePassword,
        isSecure: config.cookieIsSecure,
        isSameSite: 'Lax'
      },
      redirectTo: '/'
    })
    server.auth.default('session-auth')
  }
}

export default auth
