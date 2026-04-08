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

async function validateToken (request, session) {
  const userSession = await request.server.app.tokenCache.get(session.sessionId)

  // If session does not exist, return an invalid session
  if (!userSession) {
    return { isValid: false }
  }

  // Verify Entra token has not expired
  try {
    const decoded = Jwt.token.decode(userSession.token)
    // Jwt.token.verifyTime(decoded, {}, 2000000000)
    Jwt.token.verifyTime(decoded)
  } catch (err) {    
    console.log('Refreshing token for session:', {
      sessionId: session.sessionId,
      profileId: session.profile.id,
      profileEmail: session.profile.email,
    }) // Debug log to check session ID being validated

    // FIXME: handle non 200 responses from token refresh
    const { access_token: token, refresh_token: refreshToken } = await refreshTokens(userSession.refreshToken)
    userSession.token = token
    userSession.refreshToken = refreshToken
    await request.server.app.tokenCache.set(session.sessionId, userSession)
  }

  // FIXME: handle clearing up session cache on sign out

  return { isValid: true }
}

export default auth
