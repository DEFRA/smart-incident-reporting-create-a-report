import constants from '../utils/constants.js'

const handlers = {
  get: async (_request, h) => {
    return h.view(constants.views.REPORTER, {
      ...getContext()
    })
  },
  post: async (request, h) => {
    return h.redirect(constants.routes.REPORTER)
  }
}

const getContext = () => {
  return {
    isReporter: true,
    pageTitle: 'Reporter'
  }
}

export default [
  {
    method: 'GET',
    path: constants.routes.REPORTER,
    handler: handlers.get,
    options: {
      auth: false
    }
  }, {
    method: 'POST',
    path: constants.routes.REPORTER,
    handler: handlers.post,
    options: {
      auth: false
    }
  }
]
