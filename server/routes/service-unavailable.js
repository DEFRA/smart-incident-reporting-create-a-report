import constants from '../utils/constants.js'

const handlers = {
  get: async (_request, h) => {
    return h.view(constants.views.SERVICE_UNAVAILABLE)
  }
}

export default [
  {
    method: 'GET',
    path: constants.routes.SERVICE_UNAVAILABLE,
    handler: handlers.get,
    options: {
      auth: false
    }
  }
]
