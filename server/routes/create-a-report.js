import constants from '../utils/constants.js'
import { validateReportPayload } from '../utils/helpers.js'
// import { questionSets } from '../../node_modules/@defra/smart-incident-reporting/server/utils/question-sets.js'

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
        ...reportPayload
      })
    }
    return h.view(constants.views.CREATE_A_REPORT, {
      ...getContext(request.yar)
    })
  },
  post: async (request, h) => {
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
        ...request.payload
      })
    }

    // Store data in redis cache
    request.yar.set(constants.redisKeys.CREATE_A_REPORT, request.payload)

    // redirect to check answers page
    return h.redirect(constants.routes.CHECK_AND_SUBMIT)
  }
}
const getContext = session => {
  return session.get(constants.redisKeys.CREATE_A_REPORT)
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
