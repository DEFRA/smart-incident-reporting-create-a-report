import Cookie from '@hapi/cookie'
import Bell from '@hapi/bell'
import config from '../utils/config.js'
import Jwt from '@hapi/jwt'
import { refreshTokens } from '../utils/auth.js'

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
      isSecure: config.cookieIsSecure,
      forceHttps: config.cookieIsSecure,
      config: {
        tenant: config.aadTenant
      }
    })

    server.auth.strategy('session-auth', 'cookie', {
      cookie: {
        path: '/',
        password: config.authCookiePassword,
        isSecure: config.cookieIsSecure,
        isSameSite: 'Lax',
        ttl: 24 * 60 * 60 * 1000
      },
      validate: async (request, session) => validateToken(request, session),
      keepAlive: false,
      redirectTo: '/'
    })
    server.auth.default('session-auth')
  }
}

// Following validate function based on example here: https://github.com/DEFRA/fcp-entra-example
async function validateToken (request, session) {
  const userSession = await request.server.app.tokenCache.get(session.sessionId)

  if (!userSession) {
    return { isValid: false }
  }

  try {
    const decoded = Jwt.token.decode(userSession.token)
    Jwt.token.verifyTime(decoded)
    throw new Error('Token expired')
  } catch (err) {
    const { access_token: token, refresh_token: refreshToken } = await refreshTokens(userSession)
    userSession.token = token
    userSession.refreshToken = refreshToken
    await request.server.app.tokenCache.set(session.sessionId, userSession)
  }

  return { isValid: true }
}

export default auth
