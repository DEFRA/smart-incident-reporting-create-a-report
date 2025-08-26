import constants from '../utils/constants.js'
import { findByPostcode } from '../services/find-location.js'
const handlers = {
  post: async (request, h) => {
    const { buildingDetails, postcode } = request.payload
    const result = await findAddresses(request)
    request.yar.set(constants.redisKeys.CHOOSE_ADDRESS, result)
    request.yar.set(constants.redisKeys.BUILDING_DATA, { buildingDetails, postcode })
    return result
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
    // request.yar.clear(constants.redisKeys.CONFIRM_ADDRESS)
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
    method: 'POST',
    path: '/get-addresses',
    handler: handlers.post
  }
]
