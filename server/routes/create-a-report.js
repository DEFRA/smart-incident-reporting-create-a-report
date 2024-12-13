import constants from '../utils/constants.js'
import { validateReportPayload } from '../utils/helpers.js'
import { reportTypes } from '../utils/report-types.js'

const handlers = {
  get: async (request, h) => {
    const reportPayload = request.yar.get(constants.redisKeys.CREATE_A_REPORT)
    const errorSummary = reportPayload && validateReportPayload(reportPayload)
    if (errorSummary?.description.errorList.length > 0 ||
      errorSummary?.reporter.errorList.length > 0 ||
      errorSummary?.location.errorList.length > 0 ||
      errorSummary?.date.errorList.length > 0
    ) {
      return h.view(constants.views.CREATE_A_REPORT, {
        errorSummary,
        ...getContext(request.yar)
      })
    }
    return h.view(constants.views.CREATE_A_REPORT, {
      ...getContext(request.yar)
    })
  },
  post: async (request, h) => {
    // Store data in redis cache
    request.yar.set(constants.redisKeys.CREATE_A_REPORT, request.payload)

    // Validate payload
    const errorSummary = validateReportPayload(request.payload)

    // Return view if errors
    if (errorSummary.description.errorList.length > 0 ||
      errorSummary.reporter.errorList.length > 0 ||
      errorSummary.location.errorList.length > 0 ||
      errorSummary.date.errorList.length > 0
    ) {
      return h.view(constants.views.CREATE_A_REPORT, {
        errorSummary,
        ...request.payload,
        reportTypes
      })
    }

    // redirect to check answers page
    return h.redirect(constants.routes.CHECK_AND_SUBMIT_REPORT)
  }
}
const getContext = session => {
  return {
    ...session.get(constants.redisKeys.CREATE_A_REPORT),
    reportTypes
  }
}

export default [
  {
    method: 'GET',
    path: constants.routes.CREATE_A_REPORT,
    handler: handlers.get
  }, {
    method: 'POST',
    path: constants.routes.CREATE_A_REPORT,
    handler: handlers.post
  }
]
