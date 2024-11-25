import constants from '../utils/constants.js'

const handlers = {
  get: async (_request, h) => {
    return h.view(constants.views.DATE, {
      ...getContext()
    })
  },
  post: async (request, h) => {
    return h.redirect(constants.routes.DATE)
  }
}

const getContext = () => {
  return {
    isDate: true,
    pageTitle: 'Date observed'
  }
}

export default [
  {
    method: 'GET',
    path: constants.routes.DATE,
    handler: handlers.get
  }, {
    method: 'POST',
    path: constants.routes.DATE,
    handler: handlers.post
  }
]
