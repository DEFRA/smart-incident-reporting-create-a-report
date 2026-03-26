import Boom from '@hapi/boom'
import wreck from '@hapi/wreck'
import constants from '../utils/constants.js'
import config from '../utils/config.js'

const handlers = {
  get: async (request, h) => {
    try {
      const userPrincipalName = request.auth?.credentials?.profile?.raw?.userPrincipalName

      if (!request.auth.isAuthenticated) {
        console.log('[RM_REDIRECT_DEBUG] Unauthenticated request on home route', {
          path: request.path,
          method: request.method,
          authError: request.auth.error?.message
        })

        return Boom.unauthorized(
          `Authentication failed due to: ${request.auth.error?.message}`
        )
      }

      const targetGroupId = config.rmGroupId
      const response = await wreck.post('https://graph.microsoft.com/v1.0/me/checkMemberGroups', {
        headers: {
          Authorization: `Bearer ${request.auth.credentials.token}`,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify({ groupIds: [targetGroupId] }),
        json: true
      })

      const isMember = (response.payload?.value || []).includes(targetGroupId)

      console.log('[RM_REDIRECT_DEBUG] Membership check complete', {
        path: request.path,
        method: request.method,
        userPrincipalName,
        targetGroupId,
        returnedGroupCount: response.payload?.value?.length || 0,
        isMember
      })

      // Set session cookie with profile and membership result
      request.cookieAuth.set({
        profile: request.auth.credentials.profile,
        isMember
      })

      return h.redirect(constants.views.CREATE_A_REPORT)
    } catch (err) {
      console.log('[RM_REDIRECT_DEBUG] Membership check failed', {
        path: request.path,
        method: request.method,
        userPrincipalName,
        targetGroupId: config.rmGroupId,
        errorMessage: err?.message
      })

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
