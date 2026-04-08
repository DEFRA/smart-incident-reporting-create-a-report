import Boom from '@hapi/boom'
import wreck from '@hapi/wreck'
import constants from '../utils/constants.js'
import config from '../utils/config.js'
import { getSessionIdFromToken } from '../utils/auth.js'

const handlers = {
  get: async (request, h) => {
    try {
      if (!request.auth.isAuthenticated) {
        return Boom.unauthorized(
          `Authentication failed due to: ${request.auth.error?.message}`
        )
      }

      const { profile, token, refreshToken } = request.auth.credentials
      const sessionId = getSessionIdFromToken(token)

      // Set session cookie
      request.cookieAuth.set({
        sessionId,
        profile
      })

      await request.server.app.tokenCache.set(sessionId, {
        profile,
        token,
        refreshToken
      })

      return h.redirect(constants.views.CREATE_A_REPORT)
    } catch (err) {
      // FIXME: won't be calling graph from here anymore
      console.error('Error calling Graph API:', err)
      return Boom.badGateway('Failed to contact Microsoft Graph API')
    }
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
