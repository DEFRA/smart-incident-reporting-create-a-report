import constants from '../utils/constants.js'
import config from '../utils/config.js'

const handlers = {
  get: async (request, h) => {
    request.cookieAuth.clear()
    return h.redirect(`https://login.microsoftonline.com/${config.aadTenant}/oauth2/v2.0/logout?post_logout_redirect_uri=${config.serviceUrl}/signed-out`)
  }
}

export default [
  {
    method: 'GET',
    path: constants.routes.SIGNOUT,
    handler: handlers.get
  }
]
