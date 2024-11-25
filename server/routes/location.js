import constants from '../utils/constants.js'

const handlers = {
  get: async (_request, h) => {
    return h.view(constants.views.LOCATION, {
      ...getContext()
    })
  },
  post: async (request, h) => {
    return h.redirect(constants.routes.LOCATION)
  }
}

const getContext = () => {
  return {
    isLocation: true,
    pageTitle: 'Location of incident'
  }
}

export default [
  {
    method: 'GET',
    path: constants.routes.LOCATION,
    handler: handlers.get
  }, {
    method: 'POST',
    path: constants.routes.LOCATION,
    handler: handlers.post
  }
]
