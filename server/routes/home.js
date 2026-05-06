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

    const payloadRecoveryData = request.yar.get(constants.redisKeys.POST_DATA_RECOVERY)

    if (payloadRecoveryData && constants.postPayloadDataPaths.has(payloadRecoveryData.path)) {
      console.log('----> Redirecting to path with recovered payload:')
      console.log(payloadRecoveryData.path)
      return h.redirect(payloadRecoveryData.path)
    }

    request.yar.clear(constants.redisKeys.POST_DATA_RECOVERY)
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
