import constants from '../utils/constants.js'
import { reportTypes } from '../utils/report-types.js'

const handlers = {
  get: async (request, h) => {
    // If a report hasn't be submitted then redirect to CHECK_AND_SUBMIT page
    // Then if report is invalid it will redirect user back to CREATE_A_REPORT page
    if (!request.yar.get(constants.redisKeys.REPORT_SUBMITTED)) {
      return h.redirect(constants.routes.CHECK_AND_SUBMIT_REPORT)
    }

    // get Report payload
    const reportPayload = request.yar.get(constants.redisKeys.CREATE_A_REPORT)

    // clear out session data as no longer required
    request.yar.reset()

    return h.view(constants.views.REPORT_SUBMITTED, {
      ...reportPayload,
      reportTypes
    })
  }
}

export default [
  {
    method: 'GET',
    path: constants.routes.REPORT_SUBMITTED,
    handler: handlers.get
  }
]
