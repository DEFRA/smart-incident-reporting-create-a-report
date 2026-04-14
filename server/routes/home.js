import Boom from '@hapi/boom'
import constants from '../utils/constants.js'
import { getSessionIdFromToken } from '../utils/auth.js'

const handlers = {
  get: async (request, h) => {
    if (!request.auth.isAuthenticated) {
      return Boom.unauthorized(
        `Authentication failed due to: ${request.auth.error?.message}`
      )
    }

    const { profile, token, refreshToken } = request.auth.credentials
    const sessionId = getSessionIdFromToken(token)

    request.cookieAuth.set({
      sessionId,
      profile
    })

    await request.server.app.tokenCache.set(sessionId, {
      profile,
      token,
      refreshToken
    })

    return h.redirect(constants.routes.CREATE_A_REPORT)
  }
}

export default [
  {
    method: ['GET'],
    path: '/',
    handler: handlers.get,
    options: {
      auth: {
        mode: 'try',
        strategy: 'azure-auth'
      }
    }
  }
]
