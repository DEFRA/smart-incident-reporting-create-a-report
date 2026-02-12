import { Boom } from '@hapi/boom'
import wreck from '@hapi/wreck'
import constants from '../utils/constants.js'
import config from '../utils/config.js'

const handlers = {
  get: async (request, h) => {
    try {
      if (!request.auth.isAuthenticated) {
        return Boom.unauthorized(
          `Authentication failed due to: ${request.auth.error?.message}`
        )
      }

      const response = await wreck.get('https://graph.microsoft.com/v1.0/me/memberOf', {
        headers: {
          Authorization: `Bearer ${request.auth.credentials.token}`
        },
        json: true
      })

      const entraGroupIds = (response.payload?.value || []).map(group => group.id)
      const targetGroupId = config.rmGroupId
      const isMember = entraGroupIds.includes(targetGroupId)

      // Store membership result
      request.yar.set(constants.redisKeys.GROUP_MEMBER, isMember)

      // Set session cookie
      request.cookieAuth.set({
        profile: request.auth.credentials.profile
      })

      return h.redirect(constants.views.CREATE_A_REPORT)

    } catch (err) {
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
