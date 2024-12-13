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
    return h.view(constants.views.CHECK_AND_SUBMIT_REPORT, {
      ...reportPayload
    })
  },
  post: async (request, h) => {
    const reportPayload = request.yar.get(constants.redisKeys.CREATE_A_REPORT)

    const day = reportPayload.descriptionEmailReportDateDay
    const month = reportPayload.descriptionEmailReportDateMonth
    const year = reportPayload.descriptionEmailReportDateYear
    const time = reportPayload.descriptionEmailReportTime
    const dateTimeString = `${month?.padStart(2, '0')}-${day?.padStart(2, '0')}-${year} ${time}`
    const datetimeEmailReported = new Date(dateTimeString).toISOString()

    console.log('Data for reportPayload', reportPayload)
    console.log('Data for datetimeEmailReported', datetimeEmailReported)
    // Post data to service bus queue

    // set flag to submitted
    request.yar.set(constants.redisKeys.REPORT_SUBMITTED, true)

    return h.redirect(constants.routes.REPORT_SUBMITTED)
  }
}

export default [
  {
    method: 'GET',
    path: constants.routes.CHECK_AND_SUBMIT_REPORT,
    handler: handlers.get
  }, {
    method: 'POST',
    path: constants.routes.CHECK_AND_SUBMIT_REPORT,
    handler: handlers.post
  }
]
