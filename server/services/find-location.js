import config from '../utils/config.js'
import { getJson } from '../utils/util.js'

const placesPostcodeBaseUrl = 'https://api.os.uk/search/places/v1/postcode'
const namesFindBaseUrl = 'https://api.os.uk/search/names/v1/find'
const maxPostcodeResults = 100
const maxNameResults = 50
const riverLocalTypes = 'LOCAL_TYPE:Inland_Water LOCAL_TYPE:Estuary LOCAL_TYPE:Bay'

const emptyPayload = {
  header: {
    totalresults: 0
  },
  results: []
}

const findByPostcode = async (postcode) => {
  try {
    const uri = `${placesPostcodeBaseUrl}?postcode=${postcode}&key=${config.osKey}&lr=EN&fq=logical_status_code:1 logical_status_code:6&dataset=DPA&offset=0&maxresults=${maxPostcodeResults}`
    const payload = await getJson(uri, true)
    return {
      payload
    }
  } catch (e) {
    console.log('Error occurred while calling os data hub api' + e)

    return {
      payload: emptyPayload
    }
  }
}

const findByName = async (query, fq = '') => {
  try {
    console.log('[Names API] findByName called', { query, fq })

    const params = new URLSearchParams({
      query,
      key: config.osKey,
      maxresults: String(maxNameResults)
    })

    if (fq) {
      params.set('fq', fq)
    }

    const uri = `${namesFindBaseUrl}?${params.toString()}`

    const payload = await getJson(uri, true)

    return {
      payload
    }
  } catch (e) {
    console.log('[Names API] error', e)

    return {
      payload: emptyPayload
    }
  }
}

const findRiversByName = async (query) => {
  const result = await findByName(query, riverLocalTypes)
  return result
}

const findGeographicAreasByName = async (query, localTypes = riverLocalTypes) => {
  return findByName(query, localTypes)
}

const findLocation = async ({ postcode, query, fq = '' } = {}) => {
  if (postcode) {
    return findByPostcode(postcode)
  }

  if (query) {
    return findByName(query, fq)
  }

  return {
    payload: emptyPayload
  }
}

export {
  findByPostcode,
  findByName,
  findRiversByName,
  findGeographicAreasByName,
  findLocation
}