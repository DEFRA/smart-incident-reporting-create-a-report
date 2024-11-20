import constants from '../utils/constants.js'

const handlers = {
  get: async (_request, h) => {
    return h.view(constants.views.DESCRIPTION, {
      ...getContext()
    })
  },
  post: async (request, h) => {
    return h.redirect(constants.routes.DESCRIPTION)
  }
}

const getContext = () => {
  return {
    isDescription: true,
    pageTitle: 'Incident description'
  }
}

export default [
  {
    method: 'GET',
    path: constants.routes.DESCRIPTION,
    handler: handlers.get,
    options: {
      auth: false
    }
  }, {
    method: 'POST',
    path: constants.routes.DESCRIPTION,
    handler: handlers.post,
    options: {
      auth: false
    }
  }
]
