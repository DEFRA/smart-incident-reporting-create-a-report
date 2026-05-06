import constants from '../../utils/constants.js'

const handlers = {
  get: async (request, h) => {
    request.yar.clear(constants.redisKeys.POST_DATA_RECOVERY)
    return h.view(constants.views.CREATE_REPORT_CANCEL)
  },
  post: async (request, h) => {
    // Clear down session cache
    request.yar.reset()

    // redirect to create a report
    // FIXME: check this
    return h.redirect('/')
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
    handler: handlers.post,
    options: {
      auth: {
        mode: 'try',
        strategy: 'session-auth'
      }
    }
  }
]
