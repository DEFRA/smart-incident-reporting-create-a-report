import constants from '../utils/constants.js'
import config from '../utils/config.js'
import { validatePayload, validateReportPayload, formatGridReference } from '../utils/helpers.js'
import { questionSets } from '@defra/smart-incident-reporting/server/utils/question-sets.js'
import { reportTypes } from '../utils/report-types.js'
import { ngrToEaNo, eaNoToLatLng } from '../utils/ngr-transform.js'
import bngToNgr from '../utils/bng-to-ngr.js'
import { oSGBToWGS84 } from '../utils/transform-point.js'
import { sendMessage } from '@defra/smart-incident-reporting/server/services/service-bus.js'
import helpers from '../utils/address-picker-helpers.js'
import { isMemberOfRMGroup } from '../utils/auth.js'

// Incident location question
const incidentLocationQuestion = {
  INCIDENT_LOCATION: {
    questionId: 4100,
    text: 'Location of incident',
    answers: {
      nationalGridReference: {
        answerId: 4101
      },
      locationDescription: {
        answerId: 4102
      },
      easting: {
        answerId: 2702
      },
      northing: {
        answerId: 2703
      },
      lng: {
        answerId: 2704
      },
      lat: {
        answerId: 2705
      }
    }
  },
  LOCATION_ADDRESS: {
    questionId: 1400,
    text: 'Enter your address',
    answers: {
      addressLine1: {
        answerId: 1401,
        text: 'Address line 1'
      },
      addressLine2: {
        answerId: 1402,
        text: 'Address line 2 (optional)'
      },
      townOrCity: {
        answerId: 1403,
        text: 'Town or city'
      },
      county: {
        answerId: 1404,
        text: 'County (optional)'
      },
      postcode: {
        answerId: 1405,
        text: 'Postcode'
      }
    }
  }
}

// show/hide not a live service message
const showMessage = config.showNonLiveMessage

const formatTextBlocks = reportPayload => {
  const formattedTextBlocks = {}

  for (const [key, value] of Object.entries(reportPayload)) {
    if (key === 'descriptionDescription' || key === 'locationDescription') {
      formattedTextBlocks[key] = value.replace(/\r\n/g, '<br>')
    }
  }

  return formattedTextBlocks
}

export const incidentLocationMapConfig = (request, reportPayload) => {
  if (!reportPayload) {
    return undefined
  }

  if (reportPayload.locationOfIncident === 'gridReference' && reportPayload.locationGridRef) {
    const gridref = formatGridReference(reportPayload.locationGridRef)
    const { ea, no } = ngrToEaNo(gridref)

    return {
      point: [Number(ea), Number(no)],
      disableControls: true,
      zoom: 10
    }
  }

  if (reportPayload.locationOfIncident === 'address') {
    const selectedAddressData = request.yar.get(constants.redisKeys.SELECTED_ADDRESS_DATA)
    const addressPoint = selectedAddressData?.[0] ? [selectedAddressData[0].x, selectedAddressData[0].y] : null

    if (!addressPoint) {
      return undefined
    }

    return {
      point: [Number(addressPoint[0]), Number(addressPoint[1])],
      disableControls: true,
      zoom: 10
    }
  }

  return undefined
}

const handlers = {
  get: async (request, h) => {
    request.yar.clear(constants.redisKeys.POST_DATA_RECOVERY)

    const reportPayload = request.yar.get(constants.redisKeys.CREATE_A_REPORT)
    const selectedAddress = constructAddress(request)
    const errorSummary = reportPayload && validateReportPayload(reportPayload)
    if (!reportPayload ||
      errorSummary.description.errorList.length > 0 ||
      errorSummary.reporter.errorList.length > 0 ||
      errorSummary.location.errorList.length > 0 ||
      errorSummary.date.errorList.length > 0
    ) {
      return h.redirect(constants.routes.CREATE_A_REPORT)
    }

    const ngrValue = formatGridReference(reportPayload.locationGridRef)
    const mapCoordinates = incidentLocationMapConfig(request, reportPayload)
    const formattedTextBlocks = formatTextBlocks(reportPayload)

    const backLinkHref = request.headers.referer ? `/${request.headers.referer.split('/').slice(-1)[0]}` : '/create-a-report'

    return h.view(constants.views.CHECK_AND_SUBMIT_REPORT, {
      showMessage,
      ...reportPayload,
      ...formattedTextBlocks,
      reportTypes,
      ngrValue,
      selectedAddress,
      mapCoordinates,
      backLinkHref
    })
  },
  post: async (request, h) => {
    // Check to see if member of RM group
    const isMember = await isMemberOfRMGroup(request)

    // Post data to service bus queue
    const payload = buildPayload(request.yar, request.auth.credentials.profile)

    // test the payload against the schema
    if (!validatePayload(payload)) {
      throw new Error('Invalid payload')
    }

    // Extra validation: make sure NGR is not an empty string and lat/lng are not NaN
    const ngr = payload.reportingAnEnvironmentalProblem.data.find(answer => answer.answerId === incidentLocationQuestion.INCIDENT_LOCATION.answers.nationalGridReference.answerId)?.otherDetails
    const lat = payload.reportingAnEnvironmentalProblem.data.find(answer => answer.answerId === incidentLocationQuestion.INCIDENT_LOCATION.answers.lat.answerId)?.otherDetails
    const lng = payload.reportingAnEnvironmentalProblem.data.find(answer => answer.answerId === incidentLocationQuestion.INCIDENT_LOCATION.answers.lng.answerId)?.otherDetails

    if (!ngr || ngr.trim() === '' || !lat || Number.isNaN(Number(lat)) || !lng || Number.isNaN(Number(lng))) {
      const errorMessage = `Invalid value/s for ngr/lat/lng: ngr=${ngr}, lat=${lat}, lng=${lng}`
      throw new Error(errorMessage)
    }

    await sendMessage(request.logger, payload)

    // set flag to submitted
    request.yar.set(constants.redisKeys.REPORT_SUBMITTED, true)

    if (isMember) {
      const reportManagerUrl = config.rmUrl
      const sessionGuid = request.yar.id

      // clear out session data as no longer required
      request.yar.reset()

      return h.redirect(`${reportManagerUrl}${sessionGuid}#`)
    } else {
      return h.redirect(constants.routes.REPORT_SUBMITTED)
    }
  }
}

const buildPayload = (session, operatorDetails) => {
  const reportPayload = session.get(constants.redisKeys.CREATE_A_REPORT)
  const selectedAddress = session.get(constants.redisKeys.SELECTED_ADDRESS_DATA)
  let datetimeEmailReported
  if (reportPayload.descriptionReportedByEmail) {
    const dateTimeString = `${reportPayload.descriptionEmailReportDateYear}-${reportPayload.descriptionEmailReportDateMonth?.padStart(2, '0')}-${reportPayload.descriptionEmailReportDateDay?.padStart(2, '0')} ${reportPayload.descriptionEmailReportTime}`
    datetimeEmailReported = new Date(dateTimeString).toISOString()
  }
  let dateTimeObserved
  const date = new Date(new Date().toDateString())
  if (reportPayload.dateObserved === 'now') {
    const timeParts = reportPayload.nowTime.split(':')
    date.setHours(timeParts[0]?.padStart(2, '0'))
    date.setMinutes(timeParts[1]?.padStart(2, '0'))
    dateTimeObserved = date.toISOString()
  } else if (reportPayload.dateObserved === 'before') {
    const dateTimeString = `${reportPayload.dateOtherYear?.padStart(2, '0')}-${reportPayload.dateOtherMonth?.padStart(2, '0')}-${reportPayload.dateOtherDay} ${reportPayload.dateOtherTime}`
    dateTimeObserved = new Date(dateTimeString).toISOString()
  } else if (reportPayload.dateObserved === 'yesterday') {
    const timeParts = reportPayload.dateTimeYesterday.split(':')
    date.setDate(date.getDate() - 1)
    date.setHours(timeParts[0]?.padStart(2, '0'))
    date.setMinutes(timeParts[1]?.padStart(2, '0'))
    dateTimeObserved = date.toISOString()
  } else if (reportPayload.dateObserved === 'today') {
    const timeParts = reportPayload.dateTimeToday.split(':')
    date.setHours(timeParts[0]?.padStart(2, '0'))
    date.setMinutes(timeParts[1]?.padStart(2, '0'))
    dateTimeObserved = date.toISOString()
  } else {
    // do nothing
  }

  const payload = {
    reportingAnEnvironmentalProblem: {
      sessionGuid: session.id,
      reporterName: `${reportPayload.reporterFirstName} ${reportPayload.reporterLastName}`,
      reporterEmailAddress: reportPayload.reporterEmail,
      reporterPhoneNumber: reportPayload.reporterPhone,
      reporterReference: reportPayload.reporterReference,
      reportType: Number(reportPayload.descriptionIncidentType),
      reporterHomeAddress: reportPayload.reporterHomeAddress,
      datetimeObserved: dateTimeObserved,
      datetimeReported: datetimeEmailReported || (new Date()).toISOString(),
      otherDetails: reportPayload.descriptionDescription.replace(/\r/g, ''),
      questionSetId: questionSets.CREATE_A_REPORT.questionSetId,
      loggedByDisplayName: operatorDetails.raw.displayName,
      loggedByUserPrincipalName: operatorDetails.raw.userPrincipalName,
      data: buildAnswersData(reportPayload, questionSets.CREATE_A_REPORT.questions, selectedAddress)
    }
  }

  return payload
}

const buildAnswersData = (reportPayload, questions, selectedAddress) => {
  return [
    ...buildReportedByEmailAnswer(reportPayload, questions),
    ...buildPhotosOrVideosAnswer(reportPayload, questions),
    ...buildReporterTypeAnswers(reportPayload, questions),
    ...buildIncidentLocationAnswers(reportPayload, selectedAddress)
  ]
}

const buildReportedByEmailAnswer = (reportPayload, questions) => {
  const question = questions.REPORTED_BY_EMAIL

  return [{
    questionId: question.questionId,
    questionAsked: question.text,
    questionResponse: true,
    answerId: reportPayload.descriptionReportedByEmail ? question.answers.yes.answerId : question.answers.no.answerId
  }]
}

const buildPhotosOrVideosAnswer = (reportPayload, questions) => {
  const question = questions.REPORTED_PHOTOS_OR_VIDEOS
  const hasPhotos = reportPayload.reporterPhotos === 'Yes'
  const hasVideos = reportPayload.reporterVideos === 'Yes'

  return [
    {
      questionId: question.questionId,
      questionAsked: question.text,
      questionResponse: true,
      answerId: hasPhotos
        ? question.answers.yesPhotos.answerId
        : question.answers.noPhotos.answerId
    },
    {
      questionId: question.questionId,
      questionAsked: question.text,
      questionResponse: true,
      answerId: hasVideos
        ? question.answers.yesVideo.answerId
        : question.answers.noVideo.answerId
    }
  ]
}

const buildReporterTypeAnswers = (reportPayload, questions) => {
  const results = []
  const question = questions.TYPE_OF_REPORTER
  const baseAnswer = {
    questionId: question.questionId,
    questionAsked: question.text,
    questionResponse: true
  }
  const reporterType = reportPayload.reporterType
  const isPublic = reporterType === 'public'

  if (isPublic) {
    const isAnonymous = !reportPayload.reporterFirstName && !reportPayload.reporterLastName && !reportPayload.reporterEmail && !reportPayload.reporterPhone

    results.push({
      ...baseAnswer,
      answerId: isAnonymous ? question.answers.anonymous.answerId : question.answers.public.answerId,
      otherDetails: isAnonymous ? 'Anonymous' : 'Member of public'
    })
  } else {
    const isWater = reporterType === 'water'
    const orgAnswer = getOrganisationAnswer(question, baseAnswer, isWater)
    const nameAnswer = getNameAnswer(question, baseAnswer, isWater, reportPayload)

    results.push(orgAnswer)
    results.push(nameAnswer)

    if (reportPayload.reporterRole) {
      results.push({
        ...baseAnswer,
        answerId: question.answers.role.answerId,
        otherDetails: reportPayload.reporterRole
      })
    }
  }

  return results
}

const buildIncidentLocationAnswersGridRef = (reportPayload, baseAnswer, question) => {
  const results = []

  const gridref = formatGridReference(reportPayload.locationGridRef)
  const eaNoCoordinates = ngrToEaNo(gridref)
  const latLngCoordinates = eaNoToLatLng(eaNoCoordinates)

  results.push(
    {
      ...baseAnswer,
      answerId: question.answers.nationalGridReference.answerId,
      otherDetails: gridref
    },
    {
      ...baseAnswer,
      answerId: question.answers.easting.answerId,
      otherDetails: Math.floor(eaNoCoordinates.ea).toString()
    },
    {
      ...baseAnswer,
      answerId: question.answers.northing.answerId,
      otherDetails: Math.floor(eaNoCoordinates.no).toString()
    },
    {
      ...baseAnswer,
      answerId: question.answers.lng.answerId,
      otherDetails: latLngCoordinates.lng.toString()
    },
    {
      ...baseAnswer,
      answerId: question.answers.lat.answerId,
      otherDetails: latLngCoordinates.lat.toString()
    }
  )

  if (reportPayload.locationDescription) {
    results.push({
      ...baseAnswer,
      answerId: question.answers.locationDescription.answerId,
      otherDetails: reportPayload.locationDescription.replace(/\r/g, '')
    })
  }

  return results
}

const buildIncidentLocationAnswersAddress = (baseAnswer, selectedAddress) => {
  const results = []

  const point = [selectedAddress[0].x, selectedAddress[0].y]
  const ngr = bngToNgr(point).text
  const lngLat = oSGBToWGS84(point)
  const six = 6

  results.push({
    ...baseAnswer,
    answerId: incidentLocationQuestion.INCIDENT_LOCATION.answers.nationalGridReference.answerId,
    otherDetails: ngr
  },
  {
    ...baseAnswer,
    answerId: incidentLocationQuestion.INCIDENT_LOCATION.answers.easting.answerId,
    otherDetails: Math.floor(point[0]).toString()
  },
  {
    ...baseAnswer,
    answerId: incidentLocationQuestion.INCIDENT_LOCATION.answers.northing.answerId,
    otherDetails: Math.floor(point[1]).toString()
  },
  {
    ...baseAnswer,
    answerId: incidentLocationQuestion.INCIDENT_LOCATION.answers.lng.answerId,
    otherDetails: lngLat[0].toFixed(six)
  },
  {
    ...baseAnswer,
    answerId: incidentLocationQuestion.INCIDENT_LOCATION.answers.lat.answerId,
    otherDetails: lngLat[1].toFixed(six)
  })

  // Build answers for address
  const baseLocationAddressAnswer = {
    questionId: incidentLocationQuestion.LOCATION_ADDRESS.questionId,
    questionAsked: incidentLocationQuestion.LOCATION_ADDRESS.text,
    questionResponse: true
  }
  const addressData = selectedAddress[0].address
  const { addressLine1, addressLine2, townOrCity, postcode } = helpers.formatAddress(addressData)

  results.push({
    ...baseLocationAddressAnswer,
    answerId: incidentLocationQuestion.LOCATION_ADDRESS.answers.addressLine1.answerId,
    otherDetails: addressLine1
  },
  {
    ...baseLocationAddressAnswer,
    answerId: incidentLocationQuestion.LOCATION_ADDRESS.answers.addressLine2.answerId,
    otherDetails: addressLine2 || ''
  },
  {
    ...baseLocationAddressAnswer,
    answerId: incidentLocationQuestion.LOCATION_ADDRESS.answers.townOrCity.answerId,
    otherDetails: townOrCity
  },
  {
    ...baseLocationAddressAnswer,
    answerId: incidentLocationQuestion.LOCATION_ADDRESS.answers.county.answerId,
    otherDetails: ''
  },
  {
    ...baseLocationAddressAnswer,
    answerId: incidentLocationQuestion.LOCATION_ADDRESS.answers.postcode.answerId,
    otherDetails: postcode
  })

  return results
}

const buildIncidentLocationAnswers = (reportPayload, selectAddress) => {
  const question = incidentLocationQuestion.INCIDENT_LOCATION
  const baseAnswer = {
    questionId: question.questionId,
    questionAsked: question.text,
    questionResponse: true
  }

  let results

  if (reportPayload.locationOfIncident === 'gridReference') {
    results = buildIncidentLocationAnswersGridRef(reportPayload, baseAnswer, question)
  }

  if (reportPayload.locationOfIncident === 'address') {
    results = buildIncidentLocationAnswersAddress(baseAnswer, selectAddress)
  }

  return results
}

const getOrganisationAnswer = (question, baseAnswer, isWater) => {
  return {
    ...baseAnswer,
    answerId: isWater ? question.answers.water.answerId : question.answers.other.answerId,
    otherDetails: isWater ? 'Water Company' : 'Public organisation'
  }
}

const getNameAnswer = (question, baseAnswer, isWater, payload) => {
  return {
    ...baseAnswer,
    answerId: question.answers.name.answerId,
    otherDetails: isWater ? payload.reporterWaterName : payload.reporterOtherName
  }
}

const constructAddress = (request) => {
  const selectedAddress = request.yar.get(constants.redisKeys.SELECTED_ADDRESS)
  let address

  if (selectedAddress) {
    address = selectedAddress.addressLine1

    // Include addressLine2 if present
    if (selectedAddress.addressLine2) {
      address += `<br>${selectedAddress.addressLine2}`
    }

    address += `<br>${selectedAddress.townOrCity}<br>${selectedAddress.postcode}`
  }
  return address
}

export default [
  {
    method: 'GET',
    path: constants.routes.CHECK_AND_SUBMIT_REPORT,
    handler: handlers.get
  }, {
    method: 'POST',
    path: constants.routes.CHECK_AND_SUBMIT_REPORT,
    handler: handlers.post,
    options: {
      auth: {
        mode: 'try',
        strategy: 'session-auth'
      }
    }
  }
]
