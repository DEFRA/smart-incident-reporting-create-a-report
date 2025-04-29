import constants from '../utils/constants.js'
import { validatePayload, validateReportPayload, formatGridReference, getErrorSummary } from '../utils/helpers.js'
import { questionSets } from '@defra/smart-incident-reporting/server/utils/question-sets.js'
import { reportTypes } from '../utils/report-types.js'
import { incidentCategories } from '../utils/category-types.js'
import { sendMessage } from '@defra/smart-incident-reporting/server/services/service-bus.js'

const handlers = {
  get: async (request, h) => {
    const reportPayload = request.yar.get(constants.redisKeys.CREATE_A_REPORT)
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
    return h.view(constants.views.CHECK_AND_SUBMIT_REPORT, {
      ...reportPayload,
      reportTypes,
      ngrValue,
      incidentCategories
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
    const payload = buildPayload(request.yar)

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

const buildPayload = (session) => {
  const reportPayload = session.get(constants.redisKeys.CREATE_A_REPORT)
  const { answerId, answerDetails } = session.get(constants.redisKeys.CHECK_AND_SUBMIT_REPORT)
  let datetimeEmailReported
  if (reportPayload.descriptionReportedByEmail) {
    const dateTimeString = `${reportPayload.descriptionEmailReportDateYear}-${reportPayload.descriptionEmailReportDateMonth?.padStart(2, '0')}-${reportPayload.descriptionEmailReportDateDay?.padStart(2, '0')} ${reportPayload.descriptionEmailReportTime}`
    datetimeEmailReported = new Date(dateTimeString).toISOString()
  }
  let dateTimeObserved
  if (reportPayload.dateObserved === 'before') {
    const dateTimeString = `${reportPayload.dateOtherYear?.padStart(2, '0')}-${reportPayload.dateOtherMonth?.padStart(2, '0')}-${reportPayload.dateOtherDay} ${reportPayload.dateOtherTime}`
    dateTimeObserved = new Date(dateTimeString).toISOString()
  } else {
    const date = new Date(new Date().toDateString())
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
      reportType: Number(reportPayload.descriptionIncidentType),
      datetimeObserved: dateTimeObserved,
      datetimeReported: datetimeEmailReported || (new Date()).toISOString(),
      otherDetails: reportPayload.descriptionDescription,
      questionSetId: questionSets.CREATE_A_REPORT.questionSetId,
      incidentCategory: answerId,
      reasonForCategorisation: answerDetails,
      data: buildAnswersData(reportPayload, questionSets.CREATE_A_REPORT.questions)
    }
  }

  return payload
}

const buildAnswersData = (reportPayload, questions) => {
  const data = []
  // Reported By Email
  data.push({
    questionId: questions.REPORTED_BY_EMAIL.questionId,
    questionAsked: questions.REPORTED_BY_EMAIL.text,
    questionResponse: true,
    answerId: reportPayload.descriptionReportedByEmail ? questions.REPORTED_BY_EMAIL.answers.yes.answerId : questions.REPORTED_BY_EMAIL.answers.no.answerId
  })

  // Has photos or videos
  data.push({
    questionId: questions.REPORTED_PHOTOS_OR_VIDEOS.questionId,
    questionAsked: questions.REPORTED_PHOTOS_OR_VIDEOS.text,
    questionResponse: true,
    answerId: reportPayload.reporterPhotos === 'Yes' ? questions.REPORTED_PHOTOS_OR_VIDEOS.answers.yes.answerId : questions.REPORTED_PHOTOS_OR_VIDEOS.answers.no.answerId
  })

  // External Organisation report
  if (reportPayload.reporterOrgType) {
    data.push({
      questionId: questions.EXTERNAL_ORGANISATION_REPORT.questionId,
      questionAsked: questions.EXTERNAL_ORGANISATION_REPORT.text,
      questionResponse: true,
      answerId: reportPayload.reporterOrgType === 'water' ? questions.EXTERNAL_ORGANISATION_REPORT.answers.water.answerId : questions.EXTERNAL_ORGANISATION_REPORT.answers.other.answerId,
      otherDetails: reportPayload.reporterOrgType === 'water' ? 'Water Company' : 'Public organisation'
    })
    data.push({
      questionId: questions.EXTERNAL_ORGANISATION_REPORT.questionId,
      questionAsked: questions.EXTERNAL_ORGANISATION_REPORT.text,
      questionResponse: true,
      answerId: questions.EXTERNAL_ORGANISATION_REPORT.answers.name.answerId,
      otherDetails: reportPayload.reporterOrgType === 'water' ? reportPayload.reporterWaterName : reportPayload.reporterOtherName
    })
  }
  // Location of incident
  data.push({
    questionId: questions.INCIDENT_LOCATION.questionId,
    questionAsked: questions.INCIDENT_LOCATION.text,
    questionResponse: true,
    answerId: questions.INCIDENT_LOCATION.answers.nationalGridReference.answerId,
    otherDetails: formatGridReference(reportPayload.locationGridRef)
  })
  if (reportPayload.locationDescription) {
    data.push({
      questionId: questions.INCIDENT_LOCATION.questionId,
      questionAsked: questions.INCIDENT_LOCATION.text,
      questionResponse: true,
      answerId: questions.INCIDENT_LOCATION.answers.locationDescription.answerId,
      otherDetails: reportPayload.locationDescription
    })
  }
  return data
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
