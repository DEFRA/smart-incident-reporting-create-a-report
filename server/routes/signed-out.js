import constants from '../utils/constants.js'

const handlers = {
  get: async (_request, h) => {
    return h.view(constants.views.SIGNED_OUT)
  }
}

export default [
  {
    method: 'GET',
    path: constants.routes.SIGNED_OUT,
    handler: handlers.get,
    options: {
      auth: false
    }
  }
]
