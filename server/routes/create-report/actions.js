import constants from '../../utils/constants.js'
import config from '../../utils/config.js'
import { validateReportPayload, validateBuildingDataPayload, validateAddressSelectionPayload } from '../../utils/helpers.js'
import moment from 'moment'
import { reportTypes } from '../../utils/report-types.js'
import helpers from '../../utils/address-picker-helpers.js'
import { formatTime24hr } from '../../utils/time-helpers.js'
import { isWaterCompanyEmail } from '../../utils/water-company-domains.js'

const getMediaSelections = (payloadData) => {
  if (!payloadData.reporterMediaAvailable) {
    return []
  }

  return Array.isArray(payloadData.reporterMediaAvailable)
    ? payloadData.reporterMediaAvailable
    : [payloadData.reporterMediaAvailable]
}

const mapReporterMediaFlags = (payloadData) => {
  const mediaSelections = getMediaSelections(payloadData)

  if (mediaSelections.length > 0) {
    payloadData.reporterPhotos = mediaSelections.includes('Photos') ? 'Yes' : 'No'
    payloadData.reporterVideos = mediaSelections.includes('Video') ? 'Yes' : 'No'
  } else {
    payloadData.reporterPhotos = payloadData.reporterPhotos || 'No'
    payloadData.reporterVideos = payloadData.reporterVideos || 'No'
  }

  delete payloadData.reporterMediaAvailable
}

const setReporterHomeAddressDefault = (payloadData) => {
  if (payloadData.locationOfIncident === 'address' && !payloadData.reporterHomeAddress) {
    payloadData.reporterHomeAddress = 'No'
    return
  }

  if (payloadData.locationOfIncident === 'gridReference') {
    payloadData.reporterHomeAddress = ''
  }
}

const setNowDateDefaults = (payloadData) => {
  if (payloadData.dateObserved !== 'now') {
    return
  }

  const currentTime = moment().format('HH:mm')
  payloadData.nowTime = currentTime

  // Clear other payload time/date data when date observed is now.
  payloadData.dateTimeToday = ''
  payloadData.dateTimeYesterday = ''
  payloadData.dateOtherDay = ''
  payloadData.dateOtherMonth = ''
  payloadData.dateOtherYear = ''
  payloadData.dateOtherTime = ''
}

const trimStringFields = (payloadData) => {
  for (const [key, value] of Object.entries(payloadData)) {
    if (typeof value === 'string') {
      payloadData[key] = value.trim()
    }
  }
}

function checkReportFinalisePayloadData (payloadData, addressChosen) {
  mapReporterMediaFlags(payloadData)
  setReporterHomeAddressDefault(payloadData)

  payloadData.addressChosen = !!addressChosen
  setNowDateDefaults(payloadData)
  trimStringFields(payloadData)
}

const errorDetected = errorSummary =>
  errorSummary.description.errorList.length > 0 ||
  errorSummary.reporter.errorList.length > 0 ||
  errorSummary.location.errorList.length > 0 ||
  errorSummary.date.errorList.length > 0

const getRedirectRoute = (payloadData) => {
  if (!payloadData.reporterEmail) {
    return constants.routes.CHECK_AND_SUBMIT_REPORT
  }

  if (payloadData.reporterType === 'water') {
    return constants.routes.CHECK_AND_SUBMIT_REPORT
  }

  const isPublicOrOther = payloadData.reporterType === 'public' || payloadData.reporterType === 'other'
  if (isPublicOrOther && !isWaterCompanyEmail(payloadData.reporterEmail)) {
    return constants.routes.CHECK_AND_SUBMIT_REPORT
  }

  return constants.routes.CHECK_REPORTER_TYPE
}

const setupAddressFlags = (request, payloadData) => {
  const displayAddress = request.yar.get(constants.redisKeys.SELECTED_ADDRESS)
  return {
    selectAddress: payloadData.locationOfIncident === 'address',
    selectGridReference: payloadData.locationOfIncident === 'gridReference',
    addressChosen: !!displayAddress,
    displayAddress
  }
}

const clearReporterFields = (payloadData) => {
  if (payloadData.reporterType !== 'water') {
    payloadData.reporterWaterName = ''
  }
  if (payloadData.reporterType !== 'other') {
    payloadData.reporterOtherName = ''
    payloadData.reporterRole = ''
  }
}

const formatPayloadContent = (payloadData) => {
  const timeFields = ['dateTimeToday', 'dateTimeYesterday', 'dateOtherTime', 'descriptionEmailReportTime']
  for (const field of timeFields) {
    if (payloadData[field]) {
      payloadData[field] = formatTime24hr(payloadData[field])
    }
  }

  for (const [key, value] of Object.entries(payloadData)) {
    if (key === 'descriptionDescription' || key === 'locationDescription') {
      payloadData[key] = value.replace(/&#13;&#10;/g, '\r\n')
    }
  }
}

function checkReport (h, request, payloadData) {
  const flags = setupAddressFlags(request, payloadData)

  checkReportFinalisePayloadData(payloadData, flags.addressChosen)
  clearReporterFields(payloadData)

  request.yar.set(constants.redisKeys.CREATE_A_REPORT, payloadData)

  const errorSummary = validateReportPayload(payloadData)

  if (errorDetected(errorSummary)) {
    const result = request.yar.get(constants.redisKeys.CHOOSE_ADDRESS)
    const dispName = request.auth.credentials.profile.displayName
    const showMessage = config.showNonLiveMessage
    return h.view(constants.views.CREATE_A_REPORT, {
      errorSummary,
      ...payloadData,
      reportTypes,
      dispName,
      ...flags.displayAddress,
      ...result,
      selectAddress: flags.selectAddress,
      selectGridReference: flags.selectGridReference,
      addressChosen: flags.addressChosen,
      showMessage
    })
  }

  formatPayloadContent(payloadData)
  request.yar.set(constants.redisKeys.CREATE_A_REPORT, payloadData)

  const redirectRoute = getRedirectRoute(payloadData)
  return h.redirect(redirectRoute)
}

async function findAddress (h, request, payloadData) {
  request.yar.set(constants.redisKeys.CREATE_A_REPORT, payloadData)
  const errorSummary = validateBuildingDataPayload(payloadData)
  const showMessage = config.showNonLiveMessage

  if (errorSummary.location.errorList.length > 0) {
    const selectAddress = true
    const dispName = request.auth.credentials.profile.displayName

    return h.view(constants.views.CREATE_A_REPORT, {
      selectAddress,
      errorSummary,
      ...payloadData,
      reportTypes,
      dispName,
      showMessage
    })
  }

  const { buildingDetails, postcodeDetails } = request.payload
  const result = await helpers.findAddresses(request.yar, buildingDetails, postcodeDetails)

  request.yar.set(constants.redisKeys.CHOOSE_ADDRESS, result)
  request.yar.set(constants.redisKeys.BUILDING_DATA, { buildingDetails, postcodeDetails })

  const showChooseAddress = true

  return h.view(constants.views.CREATE_A_REPORT, {
    showChooseAddress,
    ...result,
    ...payloadData,
    reportTypes,
    showMessage
  })
}

function chooseAddress (h, request, payloadData) {
  const errorSummary = validateAddressSelectionPayload(payloadData)
  const showMessage = config.showNonLiveMessage

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
      dispName,
      showMessage
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
    reportTypes,
    showMessage
  })
}

function differentAddress (h, payloadData) {
  const selectAddress = true
  const showMessage = config.showNonLiveMessage

  return h.view(constants.views.CREATE_A_REPORT, {
    selectAddress,
    ...payloadData,
    reportTypes,
    showMessage
  })
}

function changeAddress (h, request, payloadData) {
  const buildingDetails = request.yar.get(constants.redisKeys.BUILDING_DATA)
  const selectAddress = true
  const showMessage = config.showNonLiveMessage

  return h.view(constants.views.CREATE_A_REPORT, {
    selectAddress,
    ...payloadData,
    ...buildingDetails,
    reportTypes,
    showMessage
  })
}

function useGridReference (h, request, payloadData) {
  const buildingDetails = request.yar.get(constants.redisKeys.BUILDING_DATA)
  const selectGridReference = true
  const showMessage = config.showNonLiveMessage

  return h.view(constants.views.CREATE_A_REPORT, {
    selectGridReference,
    ...payloadData,
    ...buildingDetails,
    reportTypes,
    showMessage
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
