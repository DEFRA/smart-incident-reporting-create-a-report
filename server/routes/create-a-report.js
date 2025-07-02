import constants from '../utils/constants.js'
import { validateReportPayload } from '../utils/helpers.js'
import { reportTypes } from '../utils/report-types.js'
import moment from 'moment'

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
    // Trim whitespaces for string inputs in payload
    let payloadData = request.payload
    for (const [key, value] of Object.entries(payloadData)) {
      if (typeof value === 'string') {
        payloadData[key] = value.trim()
      }
    }

    // Set time for date of incident - now
    if (payloadData.dateObserved === 'now') {
      const currentTIme = moment().format('HH:mm')
      payloadData.nowTime = currentTIme

      // clear other payload time/date data
      payloadData.dateTime = ''
      payloadData.dateOtherDay = ''
      payloadData.dateOtherMonth = ''
      payloadData.dateOtherYear = ''
      payloadData.dateOtherTime = ''
    }

    // Store data in redis cache
    request.yar.set(constants.redisKeys.CREATE_A_REPORT, payloadData)

    // Validate payload
    const errorSummary = validateReportPayload(payloadData)

    // Return view if errors
    if (errorSummary.description.errorList.length > 0 ||
      errorSummary.reporter.errorList.length > 0 ||
      errorSummary.location.errorList.length > 0 ||
      errorSummary.date.errorList.length > 0
    ) {
      const dispName = request.auth.credentials.profile.displayName
      return h.view(constants.views.CREATE_A_REPORT, {
        errorSummary,
        ...payloadData,
        reportTypes,
        dispName
      })
    }

    // redirect to check answers page
    return h.redirect(constants.routes.CHECK_AND_SUBMIT_REPORT)
  }
}
const getContext = session => {
  const showMessage = process.env.SHOW_NON_LIVE_MESSAGE
  return {
    ...session.get(constants.redisKeys.CREATE_A_REPORT),
    reportTypes,
    showMessage
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
