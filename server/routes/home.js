import constants from '../utils/constants.js'

const handlers = {
  get: async (request, h) => {
    // request.yar.reset()
    // request.cookieAuth.clear()
    return h.view(constants.views.HOME)
  }
}

export default [
  {
    method: 'GET',
    path: '/',
    handler: handlers.get,
    options: {
      auth: false
      // auth: {
      //   mode: 'try',
      //   strategy: 'azure-auth'
      // }
    }
  }
]
