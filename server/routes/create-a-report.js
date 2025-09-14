import constants from '../utils/constants.js'
import config from '../utils/config.js'
import { validateReportPayload } from '../utils/helpers.js'
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
    const payloadData = request.payload

    if (action === 'check-report') {
      return actions.checkReport(h, request, payloadData)
    } else if (action === 'find-address') {
      return actions.findAddress(h, request, payloadData)
    } else if (action === 'select-address') {
      return actions.selectAddress(h, request, payloadData)
    } else if (action === 'change-address') { // Back to address picker with data
      return actions.changeAddress(h, request, payloadData)
    } else if (action === 'different-address') { // Back to address picker with no data
      return actions.differentAddress(h, request, payloadData)
    } else if (action === 'use-grid-reference') { // Back to grid ref select, retain address data
      return actions.useGridReference(h, request, payloadData)
    }
  }
}
const getContext = session => {
  const showMessage = config.showNonLiveMessage
  const address = session.get(constants.redisKeys.SELECTED_ADDRESS)
  const payloadData = session.get(constants.redisKeys.CREATE_A_REPORT)

  let selectAddress = false
  let selectGridReference = false
  let addressChosen = false

  if (payloadData?.locationOfIncident === 'address') {
    selectAddress = true
  } else if (payloadData?.locationOfIncident === 'gridReference') {
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
