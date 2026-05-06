import constants from '../utils/constants.js'
import config from '../utils/config.js'

const FIFTY = 50

const getReporterErrorSummary = () => ({
  reporter: structuredClone(constants.errorSummary)
})

const validateReporterTypeFields = (payload) => {
  const errorSummary = getReporterErrorSummary()

  if (payload.reporterType === 'water' && !payload.reporterWaterName) {
    errorSummary.reporter.errorList.push({
      text: 'Select a water company',
      href: '#reporterWaterName'
    })
  } else if (payload.reporterType === 'other') {
    if (!payload.reporterOtherName) {
      errorSummary.reporter.errorList.push({
        text: 'Enter an organisation name',
        href: '#reporterOtherName'
      })
    } else if (payload.reporterOtherName.length > FIFTY) {
      errorSummary.reporter.errorList.push({
        text: 'Organisation name must be 50 characters or less',
        href: '#reporterOtherName'
      })
    } else {
      // do nothing
    }
  } else {
    // do nothing
  }

  return errorSummary
}

const updatePayload = (reportPayload, payload) => {
  const updatedPayload = {
    ...reportPayload,
    ...payload || {},
    reporterType: payload?.reporterType || 'water',
    reporterOtherName: payload?.reporterOtherName?.trim()
  }

  // Clear reporter type-specific fields based on selection
  if (updatedPayload.reporterType !== 'water') {
    updatedPayload.reporterWaterName = ''
  }
  if (updatedPayload.reporterType !== 'other') {
    updatedPayload.reporterOtherName = ''
    updatedPayload.reporterRole = ''
  }

  return updatedPayload
}

const handlers = {
  get: (request, h) => {
    const payloadRecoveryData = request.yar.get(constants.redisKeys.POST_DATA_RECOVERY)

    if (payloadRecoveryData) {
      console.log('----> check reporter type GET handler, found payload recovery data:')
      console.log(payloadRecoveryData)
      request.yar.clear(constants.redisKeys.POST_DATA_RECOVERY)
    }

    const reportPayload = request.yar.get(constants.redisKeys.CREATE_A_REPORT) || {}
    if (!reportPayload.reporterEmail) {
      return h.redirect(constants.routes.CREATE_A_REPORT)
    }

    const updatedPayload = updatePayload(reportPayload, payloadRecoveryData?.payload)
    const showMessage = config.showNonLiveMessage

    return h.view(constants.views.CHECK_REPORTER_TYPE, {
      ...updatedPayload,
      showMessage
    })
  },
  post: (request, h) => {
    const reportPayload = request.yar.get(constants.redisKeys.CREATE_A_REPORT) || {}
    if (!reportPayload.reporterEmail) {
      return h.redirect(constants.routes.CREATE_A_REPORT)
    }

    const payload = request.payload || {}
    const updatedPayload = updatePayload(reportPayload, payload)

    const errorSummary = validateReporterTypeFields(updatedPayload)
    if (errorSummary.reporter.errorList.length > 0) {
      const showMessage = config.showNonLiveMessage
      return h.view(constants.views.CHECK_REPORTER_TYPE, {
        ...updatedPayload,
        errorSummary,
        showMessage
      })
    }

    request.yar.set(constants.redisKeys.CREATE_A_REPORT, {
      ...updatedPayload
    })

    return h.redirect(constants.routes.CHECK_AND_SUBMIT_REPORT)
  }
}

export default [
  {
    method: 'GET',
    path: constants.routes.CHECK_REPORTER_TYPE,
    handler: handlers.get
  },
  {
    method: 'POST',
    path: constants.routes.CHECK_REPORTER_TYPE,
    handler: handlers.post,
    options: {
      auth: {
        mode: 'try',
        strategy: 'session-auth'
      }
    }
  }
]
