import { Boom } from '@hapi/boom'
import constants from '../utils/constants.js'

const handlers = {
  get: async (request, h) => {
    if (!request.auth.isAuthenticated) {
      return Boom.unauthorized(`Authentication failed due to: ${request.auth.error.message}`)
    }
    request.cookieAuth.set({
      profile: request.auth.credentials.profile
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
