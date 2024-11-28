import constants from '../utils/constants.js'
import { validateReportPayload } from '../utils/helpers.js'

const handlers = {
  get: async (request, h) => {
    const reportPayload = request.yar.get(constants.redisKeys.CREATE_A_REPORT)
    const errorSummary = reportPayload && validateReportPayload(reportPayload)
    if (!reportPayload ||
      errorSummary.description.errorList.length > 0 ||
      errorSummary.reporter.errorList.length > 0 ||
      errorSummary.location.errorList.length > 0 ||
      errorSummary.date.errorList.length > 0
    ) {
      return h.redirect(constants.routes.CREATE_A_REPORT)
    }
    // if we hit this link we should validate the CREATE_A_REPORT
    // data and redirect back to create-a-report if anything fails validation
    return h.view(constants.views.CHECK_AND_SUBMIT, {
      ...getContext(request.yar)
    })
  },
  post: async (request, h) => {
    return h.redirect(constants.routes.CHECK_AND_SUBMIT)
  }
}
const getContext = session => {
  return session.get(constants.redisKeys.CREATE_A_REPORT)
}

export default [
  {
    method: 'GET',
    path: constants.routes.CHECK_AND_SUBMIT,
    handler: handlers.get
  }, {
    method: 'POST',
    path: constants.routes.CHECK_AND_SUBMIT,
    handler: handlers.post
  }
]
