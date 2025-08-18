import constants from '../utils/constants.js'
import { findByPostcode } from '../services/find-location.js'
import config from '../utils/config.js'
import { validateReportPayload } from '../utils/helpers.js'
import { reportTypes } from '../utils/report-types.js'
import moment from 'moment'

const handlers = {
  get: async (request, h) => {
    const reportPayload = request.yar.get(constants.redisKeys.CREATE_A_REPORT)
    const errorSummary = reportPayload && validateReportPayload(reportPayload)
    const showLocationOfIncident = true
    if (errorSummary?.description.errorList.length > 0 ||
      errorSummary?.reporter.errorList.length > 0 ||
      errorSummary?.location.errorList.length > 0 ||
      errorSummary?.date.errorList.length > 0
    ) {
      return h.view(constants.views.CREATE_A_REPORT, {
        showLocationOfIncident,
        errorSummary,
        ...getContext(request.yar)
      })
    }
    return h.view(constants.views.CREATE_A_REPORT, {
      showLocationOfIncident,
      ...getContext(request.yar)
    })
  },
  post: async (request, h) => {
    const { action } = request.payload
    if (action === 'check-report') {
      console.log('check report button is clicked')
      // Trim whitespaces for string inputs in payload
      const payloadData = request.payload
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

    } else if (action === 'find-address') {
      const showLocationOfIncident = false
      const showChooseAddress = true
      console.log('find address button is clicked')
      const { buildingDetails, postcode } = request.payload
      console.log('Data for buildingDetails', buildingDetails)
      console.log('Data for postcode', postcode)
      const result = await findAddresses(request)
      request.yar.set(constants.redisKeys.CHOOSE_ADDRESS, result)
      request.yar.set(constants.redisKeys.BUILDING_DATA, { buildingDetails, postcode })
      const payloadData = request.payload

      // Store data in redis cache
      request.yar.set(constants.redisKeys.CREATE_A_REPORT, payloadData)
      return h.view(constants.views.CREATE_A_REPORT, {
        showLocationOfIncident,
        showChooseAddress,
        ...result,
        ...payloadData,
        reportTypes
      })
    } else if (action === 'select-address') {
      const showLocationOfIncident = true
      const showChooseAddress = false
      console.log('select address button is clicked')
      const payloadData = request.payload
      return h.view(constants.views.CREATE_A_REPORT, {
        showLocationOfIncident,
        showChooseAddress,
        ...payloadData,
        reportTypes
      })

    }
  }
}
const getContext = session => {
  const showMessage = config.showNonLiveMessage
  return {
    ...session.get(constants.redisKeys.CREATE_A_REPORT),
    reportTypes,
    showMessage
  }
}

const findAddresses = async (request) => {
  const cachedResult = request.yar.get(constants.redisKeys.CHOOSE_ADDRESS)
  const { buildingDetails, postcode } = request.payload

  let isBuildingDetailsCached = false
  let isPostcodeCached = false
  if (cachedResult) {
    isBuildingDetailsCached = cachedResult.buildingDetails === buildingDetails
    isPostcodeCached = cachedResult.postcode === postcode
  }

  // call API only if cachedResult is null or if postcode is new
  if (!cachedResult || !isBuildingDetailsCached || !isPostcodeCached) {
    request.yar.clear(constants.redisKeys.CONFIRM_ADDRESS)
    let payload
    if (isPostcodeCached && !isBuildingDetailsCached) {
      // use the cached postcode data for updated building details
      payload = request.yar.get(constants.redisKeys.POSTCODE_DETAILS)
    } else {
      // calling API for fresh search or updated postcode
      const apiResults = await findByPostcode(postcode)
      payload = apiResults.payload
      request.yar.set(constants.redisKeys.POSTCODE_DETAILS, payload)
    }

    if (payload.header.totalresults === 0) {
      return {
        resultsFound: false,
        buildingDetails,
        postcode
      }
    }

    const { results, fullResults } = processPayload(payload, buildingDetails)
    const resultsData = results
      .map(item => {
        return {
          uprn: item.UPRN,
          postcode: item.POSTCODE,
          address: capitaliseAddress(item.ADDRESS),
          x: item.X_COORDINATE,
          y: item.Y_COORDINATE
        }
      })

    return {
      resultsFound: true,
      buildingDetails,
      postcode,
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
