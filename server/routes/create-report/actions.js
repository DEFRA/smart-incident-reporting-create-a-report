import constants from '../../utils/constants.js'
import { validateReportPayload, validateBuildingDataPayload, validateAddressSelectionPayload } from '../../utils/helpers.js'
import moment from 'moment'
import { reportTypes } from '../../utils/report-types.js'
import helpers from './address-picker-helpers.js'

function checkReport (h, request, payloadData) {
  let selectAddress = false
  let selectGridReference = false
  let addressChosen = false

  const displayAddress = request.yar.get(constants.redisKeys.SELECTED_ADDRESS)

  if (displayAddress) {
    addressChosen = true
    payloadData.addressChosen = true
  }

  if (payloadData.locationOfIncident === 'address') {
    selectAddress = true
  }

  if (payloadData.locationOfIncident === 'gridReference') {
    selectGridReference = true
  }

  // Set default value for photos or videos checkbox
  if (!payloadData.reporterPhotos) {
    payloadData.reporterPhotos = 'No'
  }

  // Trim whitespaces for string inputs in payload
  for (const [key, value] of Object.entries(payloadData)) {
    if (typeof value === 'string') {
      payloadData[key] = value.trim()
    }
    if (key === 'descriptionDescription') {
      payloadData[key] = value.replace(/\n +/g, '\n')
    }
  }

  // Set time for date of incident - now
  if (payloadData.dateObserved === 'now') {
    const currentTime = moment().format('HH:mm')
    payloadData.nowTime = currentTime

    // clear other payload time/date data
    payloadData.dateTime = ''
    payloadData.dateOtherDay = ''
    payloadData.dateOtherMonth = ''
    payloadData.dateOtherYear = ''
    payloadData.dateOtherTime = ''
  }

  // Set default value for photos or videos checkbox
  if (!payloadData.reporterPhotos) {
    payloadData.reporterPhotos = 'No'
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
    const result = request.yar.get(constants.redisKeys.CHOOSE_ADDRESS)
    const dispName = request.auth.credentials.profile.displayName
    return h.view(constants.views.CREATE_A_REPORT, {
      errorSummary,
      ...payloadData,
      reportTypes,
      dispName,
      ...displayAddress,
      ...result,
      selectAddress,
      selectGridReference,
      addressChosen
    })
  }

  // redirect to check answers page
  return h.redirect(constants.routes.CHECK_AND_SUBMIT_REPORT)
}

async function findAddress (h, request, payloadData) {
  request.yar.set(constants.redisKeys.CREATE_A_REPORT, payloadData)
  const errorSummary = validateBuildingDataPayload(payloadData)

  if (errorSummary.location.errorList.length > 0) {
    const selectAddress = true
    const dispName = request.auth.credentials.profile.displayName

    return h.view(constants.views.CREATE_A_REPORT, {
      selectAddress,
      errorSummary,
      ...payloadData,
      reportTypes,
      dispName
    })
  }

  const { buildingDetails, postcodeDetails } = request.payload
  const result = await helpers.findAddresses(request)

  request.yar.set(constants.redisKeys.CHOOSE_ADDRESS, result)
  request.yar.set(constants.redisKeys.BUILDING_DATA, { buildingDetails, postcodeDetails })

  const showChooseAddress = true

  return h.view(constants.views.CREATE_A_REPORT, {
    showChooseAddress,
    ...result,
    ...payloadData,
    reportTypes
  })
}

function chooseAddress (h, request, payloadData) {
  const errorSummary = validateAddressSelectionPayload(payloadData)

  // Return view if errors
  if (errorSummary.location.errorList.length > 0) {
    const dispName = request.auth.credentials.profile.displayName
    const addressResult = request.yar.get(constants.redisKeys.CHOOSE_ADDRESS)
    const showChooseAddress = true

    return h.view(constants.views.CREATE_A_REPORT, {
      errorSummary,
      showChooseAddress,
      ...addressResult,
      ...payloadData,
      reportTypes,
      dispName
    })
  }

  let { addressId } = request.payload
  // convert addressId to number
  addressId = Number(addressId)
  const result = request.yar.get(constants.redisKeys.CHOOSE_ADDRESS)
  const selectedAddress = result.resultsData.filter(item => Number(item.uprn) === addressId)
  const addressData = selectedAddress[0].address
  request.yar.set(constants.redisKeys.SELECTED_ADDRESS, helpers.formatAddress(addressData))
  request.yar.set(constants.redisKeys.SELECTED_ADDRESS_DATA, selectedAddress)
  const displayAddress = request.yar.get(constants.redisKeys.SELECTED_ADDRESS)

  const selectAddress = true
  const addressChosen = true

  return h.view(constants.views.CREATE_A_REPORT, {
    selectAddress,
    addressChosen,
    ...payloadData,
    ...displayAddress,
    reportTypes
  })
}

function differentAddress (h, payloadData) {
  const selectAddress = true

  return h.view(constants.views.CREATE_A_REPORT, {
    selectAddress,
    ...payloadData,
    reportTypes
  })
}

function changeAddress (h, request, payloadData) {
  const buildingDetails = request.yar.get(constants.redisKeys.BUILDING_DATA)
  const selectAddress = true

  return h.view(constants.views.CREATE_A_REPORT, {
    selectAddress,
    ...payloadData,
    ...buildingDetails,
    reportTypes
  })
}

function useGridReference (h, request, payloadData) {
  const buildingDetails = request.yar.get(constants.redisKeys.BUILDING_DATA)
  const selectGridReference = true

  return h.view(constants.views.CREATE_A_REPORT, {
    selectGridReference,
    ...payloadData,
    ...buildingDetails,
    reportTypes
  })
}

export default {
  checkReport,
  findAddress,
  chooseAddress,
  differentAddress,
  changeAddress,
  useGridReference
}
