import constants from '../utils/constants.js'
import { findByPostcode } from '../services/find-location.js'
import config from '../utils/config.js'
import { validateReportPayload, validateBuildingDataPayload, validateAddressSelectionPayload } from '../utils/helpers.js'
import { reportTypes } from '../utils/report-types.js'
import moment from 'moment'

function checkReportAction (h, request, payloadData) {
  console.log('check report button is clicked')
  let hideLocationOfIncident
  let hideAddressInput
  let hideSelectedAddress
  let hideChooseAddress
  hideLocationOfIncident = false
  hideAddressInput = true
  hideSelectedAddress = false
  const selectedAddress = request.yar.get(constants.redisKeys.SELECTED_ADDRESS_DATA)
  let answer
  if (selectedAddress) {
    answer = selectedAddress[0].uprn
  }
  const displayAddress = request.yar.get(constants.redisKeys.SELECTED_ADDRESS)
  if (!displayAddress) {
    hideAddressInput = false
    hideSelectedAddress = true
  }

  if (payloadData.buildingDetails && payloadData.postcodeDetails && !payloadData.addressId) {
    hideLocationOfIncident = true
    hideChooseAddress = false
  }

  if (answer) {
    hideLocationOfIncident = false
    hideChooseAddress = true
    hideSelectedAddress = false
  }
  // Set default value for photos or videos checkbox
  if (!payloadData.reporterPhotos) {
    payloadData.reporterPhotos = 'No'
  }

  if (!payloadData.buildingDetails || !payloadData.postcodeDetails) {
    hideLocationOfIncident = false
    hideChooseAddress = true
    hideSelectedAddress = true
    hideAddressInput = false
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
      hideLocationOfIncident,
      hideAddressInput,
      hideSelectedAddress,
      hideChooseAddress,
      errorSummary,
      ...payloadData,
      reportTypes,
      dispName,
      ...displayAddress,
      ...result,
      answer
    })
  }

  // redirect to check answers page
  return h.redirect(constants.routes.CHECK_AND_SUBMIT_REPORT)
}

async function findAddressAction (h, request, payloadData) {
  console.log('find address button is clicked')
  // Store data in redis cache
  request.yar.set(constants.redisKeys.CREATE_A_REPORT, payloadData)

  // Validate payload
  const errorSummary = validateBuildingDataPayload(payloadData)

  // Return view if errors
  if (errorSummary.location.errorList.length > 0) {
    const hideLocationOfIncident = false
    const hideAddressInput = false
    const dispName = request.auth.credentials.profile.displayName
    return h.view(constants.views.CREATE_A_REPORT, {
      hideLocationOfIncident,
      hideAddressInput,
      errorSummary,
      ...payloadData,
      reportTypes,
      dispName
    })
  }

  const { buildingDetails, postcodeDetails } = request.payload
  const result = await findAddresses(request)
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

function selectAddressAction (h, request, payloadData) {
  console.log('select address button is clicked')

  // Validate payload
  const errorSummary = validateAddressSelectionPayload(payloadData)

  // Return view if errors
  if (errorSummary.location.errorList.length > 0) {
    const hideLocationOfIncident = true
    const hideAddressInput = true
    const hideChooseAddress = false
    const dispName = request.auth.credentials.profile.displayName
    const result = request.yar.get(constants.redisKeys.CHOOSE_ADDRESS)
    return h.view(constants.views.CREATE_A_REPORT, {
      hideLocationOfIncident,
      hideAddressInput,
      hideChooseAddress,
      errorSummary,
      ...result,
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
  request.yar.set(constants.redisKeys.SELECTED_ADDRESS, formatAddress(addressData))
  request.yar.set(constants.redisKeys.SELECTED_ADDRESS_DATA, selectedAddress)
  const displayAddress = request.yar.get(constants.redisKeys.SELECTED_ADDRESS)

  const selectAddress = true
  const addressChosen = true

  return h.view(constants.views.CREATE_A_REPORT, {
    selectAddress,
    addressChosen,
    ...payloadData,
    ...displayAddress
  })
}

function differentAddressAction (h, request, payloadData) {
  console.log('different address button is clicked')

  return h.view(constants.views.CREATE_A_REPORT, {
    reportTypes
  })
}

function changeAddressAction (h, request, payloadData) {
  console.log('change address button is clicked')

  const selectAddress = true

  return h.view(constants.views.CREATE_A_REPORT, {
    selectAddress,
    ...payloadData,
    reportTypes
  })
}

function useGridReferenceAction (h, request, payloadData) {
  console.log('use grid reference button is clicked')

  const selectGridReference = true

  return h.view(constants.views.CREATE_A_REPORT, {
    selectGridReference,
    ...payloadData,
    reportTypes
  })
}

const handlers = {
  get: async (request, h) => {
    console.log('GET CLICKED')
    console.log(request)
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
    console.log(request.payload)
    const { action } = request.payload
    const payloadData = request.payload

    console.log(`POST CLICKED: ${action}`)

    if (action === 'check-report') {
      return checkReportAction(h, request, payloadData)
    } else if (action === 'find-address') {
      return findAddressAction(h, request, payloadData)
    } else if (action === 'select-address') {
      return selectAddressAction(h, request, payloadData)
    } else if (action === 'change-address') { // Back to address picker with data
      return changeAddressAction(h, request, payloadData)
    } else if (action === 'different-address') { // Back to address picker with no data
      return differentAddressAction(h, request, payloadData)
    } else if (action === 'use-grid-reference') { // Back to grid ref select, retain address data
      return useGridReferenceAction(h, request, payloadData)
    }
  }
}
const getContext = session => {
  const showMessage = config.showNonLiveMessage
  const selectedAddress = session.get(constants.redisKeys.SELECTED_ADDRESS_DATA)
  const address = session.get(constants.redisKeys.SELECTED_ADDRESS)
  const result = session.get(constants.redisKeys.CHOOSE_ADDRESS)

  let answer
  if (selectedAddress) {
    answer = selectedAddress[0].uprn
  }

  console.log('Data for answer get context', answer)

  return {
    ...session.get(constants.redisKeys.CREATE_A_REPORT),
    reportTypes,
    showMessage,
    hideLocationOfIncident: false,
    hideAddressInput: selectedAddress,
    hideSelectedAddress: !selectedAddress,
    hideChooseAddress: true,
    ...result,
    ...address,
    answer
  }
}

const findAddresses = async (request) => {
  const cachedResult = request.yar.get(constants.redisKeys.CHOOSE_ADDRESS)
  const { buildingDetails, postcodeDetails } = request.payload

  let isBuildingDetailsCached = false
  let isPostcodeCached = false
  if (cachedResult) {
    isBuildingDetailsCached = cachedResult.buildingDetails === buildingDetails
    isPostcodeCached = cachedResult.postcodeDetails === postcodeDetails
  }

  // call API only if cachedResult is null or if postcode is new
  if (!cachedResult || !isBuildingDetailsCached || !isPostcodeCached) {
    let payload
    if (isPostcodeCached && !isBuildingDetailsCached) {
      // use the cached postcode data for updated building details
      payload = request.yar.get(constants.redisKeys.POSTCODE_DETAILS)
    } else {
      // calling API for fresh search or updated postcode
      const apiResults = await findByPostcode(postcodeDetails)
      payload = apiResults.payload
      request.yar.set(constants.redisKeys.POSTCODE_DETAILS, payload)
    }

    if (payload.header.totalresults === 0) {
      return {
        resultsFound: false,
        buildingDetails,
        postcodeDetails
      }
    }

    const { results, fullResults } = processPayload(payload, buildingDetails)
    const resultsData = results
      .map(item => {
        return {
          uprn: item.UPRN,
          postcodeDetails: item.POSTCODE,
          address: capitaliseAddress(item.ADDRESS),
          x: item.X_COORDINATE,
          y: item.Y_COORDINATE
        }
      })

    return {
      resultsFound: true,
      buildingDetails,
      postcodeDetails,
      showFullResults: fullResults,
      resultsData,
      resultlength: resultsData.length
    }
  } else {
    return cachedResult
  }
}

const processPayload = (payload, buildingDetails) => {
  const results = []
  const filteredItems = payload.results.map(item => item.DPA).filter(item => filterResults(item.ADDRESS, buildingDetails))
  const fullResults = filteredItems.length === 0
  const allItems = fullResults ? payload.results.map(item => item.DPA) : filteredItems
  allItems.forEach((item) => {
    if (!(results.find(result => result.UPRN === item.UPRN))) {
      results.push(item)
    }
  })

  return {
    results,
    fullResults
  }
}

const filterResults = (address, buildingDetails) => {
  const addressParts = address.toLowerCase().split(', ')
  const n = 2
  const addressLine1 = addressParts.slice(0, -n)
  const buildingData = buildingDetails.toLowerCase()
  const searchResults = addressLine1.includes(buildingData)

  return searchResults
}

const capitaliseAddress = (address) => {
  // Split the address into its components
  const components = address.split(', ')

  // Capitalise the first letter of each word except the last component (postcode)
  for (let i = 0; i < components.length - 1; i++) {
    const words = components[i].split(' ')
    for (let j = 0; j < words.length; j++) {
      words[j] = words[j].charAt(0).toUpperCase() + words[j].slice(1).toLowerCase()
    }
    components[i] = words.join(' ')
  }

  // Join the components back together
  const capitalisedAddress = components.join(', ')

  return capitalisedAddress
}

const formatAddress = (address) => {
  const addressParts = address.split(',')
  const n = 2
  const addressLine1 = addressParts.slice(0, -n).join()
  const townOrCity = addressParts[addressParts.length - 2].trimStart()
  const postcode = addressParts[addressParts.length - 1].trimStart()

  return {
    addressLine1,
    townOrCity,
    postcode
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
