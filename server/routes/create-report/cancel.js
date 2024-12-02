import constants from '../../utils/constants.js'

const handlers = {
  get: async (_request, h) => {
    return h.view(constants.views.CREATE_REPORT_CANCEL)
  },
  post: async (request, h) => {
    // Clear down session cache
    request.yar.reset()

    // redirect to create a report
    return h.redirect(constants.routes.CREATE_A_REPORT)
  }
}

export default [
  {
    method: 'GET',
    path: constants.routes.CREATE_REPORT_CANCEL,
    handler: handlers.get
  }, {
    method: 'POST',
    path: constants.routes.CREATE_REPORT_CANCEL,
    handler: handlers.post
  }
]
