import constants from '../utils/constants.js'
import config from '../utils/config.js'
import { validatePayload, validateReportPayload, formatGridReference, getErrorSummary } from '../utils/helpers.js'
import { questionSets } from '@defra/smart-incident-reporting/server/utils/question-sets.js'
import { reportTypes } from '../utils/report-types.js'
import { ngrToEaNo, eaNoToLatLng } from '../utils/ngr-transform.js'
import bngToNgr from '../utils/bng-to-ngr.js'
import { oSGBToWGS84 } from '../utils/transform-point.js'
import { incidentCategories } from '../utils/category-types.js'
import { sendMessage } from '@defra/smart-incident-reporting/server/services/service-bus.js'

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

const handlers = {
  get: async (request, h) => {
    const reportPayload = request.yar.get(constants.redisKeys.CREATE_A_REPORT)
    const selectedAddress = constructAddress(request)
    console.log(selectedAddress)
    const errorSummary = reportPayload && validateReportPayload(reportPayload)
    if (!reportPayload ||
      errorSummary.description.errorList.length > 0 ||
      errorSummary.reporter.errorList.length > 0 ||
      errorSummary.location.errorList.length > 0 ||
      errorSummary.date.errorList.length > 0
    ) {
      console.log(JSON.stringify(errorSummary, null, 2))
      return h.redirect(constants.routes.CREATE_A_REPORT)
    }
    const ngrValue = formatGridReference(reportPayload.locationGridRef)
    // formatting for incident description
    for (const [key, value] of Object.entries(reportPayload)) {
      if (key === 'descriptionDescription') {
        reportPayload[key] = value.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\r\n/g, '<br>')
      }
    }
    return h.view(constants.views.CHECK_AND_SUBMIT_REPORT, {
      showMessage,
      ...reportPayload,
      reportTypes,
      ngrValue,
      incidentCategories,
      selectedAddress
    })
  },
  post: async (request, h) => {
    const reportPayload = request.yar.get(constants.redisKeys.CREATE_A_REPORT)
    const ngrValue = formatGridReference(reportPayload.locationGridRef)
    // get payload
    let { answerId, answerDetails } = request.payload

    // validate payload for errors
    const errorSummary = validateIncidentCategory(answerId, answerDetails)
    if (errorSummary.errorList.length > 0) {
      const dispName = request.auth.credentials.profile.displayName
      return h.view(constants.views.CHECK_AND_SUBMIT_REPORT, {
        dispName,
        showMessage,
        ...reportPayload,
        errorSummary,
        reportTypes,
        ngrValue,
        incidentCategories,
        ...request.payload
      })
    }

    // convert answerId to number
    answerId = Number(answerId)

    request.yar.set(constants.redisKeys.CHECK_AND_SUBMIT_REPORT, { answerId, answerDetails })

    // Post data to service bus queue
    const payload = buildPayload(request.yar, request.auth.credentials.profile)
    console.log(payload.reportingAnEnvironmentalProblem.data)

    // test the payload against the schema
    if (!validatePayload(payload)) {
      throw new Error('Invalid payload')
    }

    await sendMessage(request.logger, payload)

    // set flag to submitted
    request.yar.set(constants.redisKeys.REPORT_SUBMITTED, true)

    return h.redirect(constants.routes.REPORT_SUBMITTED)
  }
}

const validateIncidentCategory = (answerId, answerDetails) => {
  const errorSummary = getErrorSummary()
  if (!answerId) {
    errorSummary.errorList.push({
      text: 'Select an incident category',
      href: '#answerId'
    })
  }

  if (!answerDetails) {
    errorSummary.errorList.push({
      text: 'Enter a reason for the selected categorisation',
      href: '#answerDetails'
    })
  }
  return errorSummary
}

const buildPayload = (session, operatorDetails) => {
  const reportPayload = session.get(constants.redisKeys.CREATE_A_REPORT)
  const selectedAddress = session.get(constants.redisKeys.SELECTED_ADDRESS_DATA)
  const { answerId, answerDetails } = session.get(constants.redisKeys.CHECK_AND_SUBMIT_REPORT)
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
  } else {
    if (reportPayload.dateObserved === 'yesterday') {
      date.setDate(date.getDate() - 1)
    }
    const timeParts = reportPayload.dateTime.split(':')
    date.setHours(timeParts[0]?.padStart(2, '0'))
    date.setMinutes(timeParts[1]?.padStart(2, '0'))
    dateTimeObserved = date.toISOString()
  }

  const payload = {
    reportingAnEnvironmentalProblem: {
      sessionGuid: session.id,
      reporterName: `${reportPayload.reporterFirstName} ${reportPayload.reporterLastName}`,
      reporterEmailAddress: reportPayload.reporterEmail,
      reporterPhoneNumber: reportPayload.reporterPhone,
      reporterReference: reportPayload.reporterReference,
      reportType: Number(reportPayload.descriptionIncidentType),
      datetimeObserved: dateTimeObserved,
      datetimeReported: datetimeEmailReported || (new Date()).toISOString(),
      otherDetails: reportPayload.descriptionDescription,
      questionSetId: questionSets.CREATE_A_REPORT.questionSetId,
      incidentCategory: answerId,
      reasonForCategorisation: answerDetails,
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

  return [{
    questionId: question.questionId,
    questionAsked: question.text,
    questionResponse: true,
    answerId: reportPayload.reporterPhotos === 'Yes' ? question.answers.yes.answerId : question.answers.no.answerId
  }]
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
      otherDetails: reportPayload.locationDescription
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
  const { addressLine1, townOrCity, postcode } = formatAddress(addressData)

  results.push({
    ...baseLocationAddressAnswer,
    answerId: incidentLocationQuestion.LOCATION_ADDRESS.answers.addressLine1.answerId,
    otherDetails: addressLine1
  },
  {
    ...baseLocationAddressAnswer,
    answerId: incidentLocationQuestion.LOCATION_ADDRESS.answers.addressLine2.answerId,
    otherDetails: ''
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

const constructAddress = (request) => {
  const selectedAddress = request.yar.get(constants.redisKeys.SELECTED_ADDRESS)
  let address
  if (selectedAddress) {
    address = `${selectedAddress.addressLine1}<br>${selectedAddress.townOrCity}<br>${selectedAddress.postcode}`
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
    handler: handlers.post
  }
]
