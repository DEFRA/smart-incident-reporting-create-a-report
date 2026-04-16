import constants from '../utils/constants.js'
import config from '../utils/config.js'
import { validateReportPayload, formatTextarea } from '../utils/helpers.js'
import { reportTypes } from '../utils/report-types.js'
import actions from './create-report/actions.js'

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
    const { action } = request.payload
    const payload = request.payload
    const payloadData = formatTextarea(payload)

    let actionResult

    if (action === 'check-report') {
      actionResult = actions.checkReport(h, request, payloadData)
    }

    if (action === 'find-address') {
      actionResult = actions.findAddress(h, request, payloadData)
    }

    if (action === 'find-name') {
      actionResult = actions.findName(h, request, payloadData)
    }

    if (action === 'select-address') {
      actionResult = actions.chooseAddress(h, request, payloadData)
    }

    if (action === 'change-address') { // Back to address picker with data
      actionResult = actions.changeAddress(h, request, payloadData)
    }

    if (action === 'different-address') { // Back to address picker with no data
      actionResult = actions.differentAddress(h, payloadData)
    }

    if (action === 'use-grid-reference') { // Back to grid ref select, retain address data
      actionResult = actions.useGridReference(h, request, payloadData)
    }

    return actionResult
  }
}
const getContext = session => {
  const showMessage = config.showNonLiveMessage
  const address = session.get(constants.redisKeys.SELECTED_ADDRESS)
  const payload = session.get(constants.redisKeys.CREATE_A_REPORT) || {}
  const payloadData = formatTextarea(payload)
  let selectAddress = false
  let selectGridReference = false
  let addressChosen = false

  if (payloadData?.locationOfIncident === 'address') {
    selectAddress = true
  }

  if (payloadData?.locationOfIncident === 'gridReference') {
    selectGridReference = true
  }

  if (address) {
    addressChosen = true
  }

  return {
    ...payloadData,
    reportTypes,
    showMessage,
    ...address,
    selectAddress,
    selectGridReference,
    addressChosen
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
