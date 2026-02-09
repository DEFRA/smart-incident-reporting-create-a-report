import { Boom } from '@hapi/boom'
import constants from '../utils/constants.js'
import config from '../utils/config.js'
import wreck from '@hapi/wreck'

const handlers = {
  get: async (request, h) => {
    const response = await wreck.get('https://graph.microsoft.com/v1.0/me/memberOf', {
      headers: {
        Authorization: `Bearer ${request.auth.credentials.token}`
      },
      json: true
    })

    // console.log('Data for request.auth.credentials.token', request.auth.credentials.token)

    const entraGroupIds = response.payload.value.map(group => group.id)
    console.log('Entra group ids this user is a member of:', entraGroupIds)
    
    const targetGroupId = config.rmGroupId
    console.log('Data for targetGroupId', targetGroupId)
    const isMember = entraGroupIds.includes(targetGroupId)
    console.log('Data for isMember', isMember)
    console.log(`Is user a member of the group? ${isMember}`)
    request.yar.set(constants.redisKeys.GROUP_MEMBER, isMember)

    if (!request.auth.isAuthenticated) {
      return Boom.unauthorized(`Authentication failed due to: ${request.auth.error.message}`)
    }
    request.cookieAuth.set({
      profile: request.auth.credentials.profile,
      token: request.auth.credentials.token
    })
    return h.redirect(constants.views.CREATE_A_REPORT)
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
