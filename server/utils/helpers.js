import fs from 'node:fs'
import constants from './constants.js'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import dirname from '../../dirname.cjs'
import moment from 'moment'
import { validateEmail } from '@defra/sir-app-library'
import { formatTime24hr } from './time-helpers.js'

// Based on OS Grid ref regex: https://gist.github.com/simonjgreen/44739fe52a8b68d8128e1237f8b3dfcd
// Grid ref regex with spaces
const gridRefRegexWs = /^([STNHOstnho][A-Za-z]\s)(\d{5}\s\d{5})$/
// Grid ref regex without spaces
const gridRefRegexWos = /^([STNHOstnho][A-Za-z])(\d{5}\d{5})$/

const postcodeRegExp = /^([A-Za-z][A-Ha-hJ-Yj-y]?\d[A-Za-z0-9]? ?\d[A-Za-z]{2}|[Gg][Ii][Rr] ?0[Aa]{2})$/ // https://stackoverflow.com/a/51885364

const phoneRegex = /^[\s\d-+()#]*$/

const sirpSchema = JSON.parse(fs.readFileSync(`${dirname}/server/schemas/sirp-car-schema.json`))

const getErrorSummary = () => {
  return structuredClone(constants.errorSummary)
}

const validatePayload = (payload) => {
  const schema = sirpSchema
  const ajv = new Ajv({ strict: false })
  addFormats(ajv)
  const valid = ajv.validate(schema, payload)
  if (!valid) {
    console.error(ajv.errors)
  }
  return valid
}

const validateReportPayload = payload => {
  const errorSummary = {
    description: getErrorSummary(),
    location: getErrorSummary(),
    reporter: getErrorSummary(),
    date: getErrorSummary()
  }

  // Tab validations
  validateDescriptionTab(payload, errorSummary.description)
  validateReporterTab(payload, errorSummary.reporter)
  validateLocationTab(payload, errorSummary.location)
  validateDateTab(payload, errorSummary.date)

  return errorSummary
}

const validateBuildingDataPayload = payload => {
  const errorSummary = {
    location: getErrorSummary()
  }

  // Tab validations
  validateBuildingData(payload, errorSummary.location)
  return errorSummary
}

const validateAddressSelectionPayload = payload => {
  const errorSummary = {
    location: getErrorSummary()
  }

  // Tab validations
  validateAddressSelection(payload, errorSummary.location)
  return errorSummary
}

const getTextAreaLength = string => {
  // Sometimes the check happens on the raw string,
  // sometimes on the string that has been processed
  return string?.replace(/&#13;&#10;/g, ' ').replace(/\r\n/g, ' ').length
}

const validateDescriptionTab = (payload, errorSummary) => {
  const incidentDescriptionMax = 1500
  if (!payload.descriptionDescription) {
    errorSummary.errorList.push({
      text: 'Enter an incident description',
      href: '#descriptionDescription'
    })
  } else if (getTextAreaLength(payload.descriptionDescription) > incidentDescriptionMax) {
    errorSummary.errorList.push({
      text: 'Incident description must be 1500 characters or less',
      href: '#descriptionDescription'
    })
  } else {
    // do nothing
  }

  if (!payload.descriptionIncidentType) {
    errorSummary.errorList.push({
      text: 'Select an incident type',
      href: '#descriptionIncidentType'
    })
  }

  if (payload.descriptionReportedByEmail) {
    const day = payload.descriptionEmailReportDateDay
    const month = payload.descriptionEmailReportDateMonth
    const year = payload.descriptionEmailReportDateYear
    const time = payload.descriptionEmailReportTime
    validateDate({ day, month, year }, errorSummary, 'the', ' the email was received', '#descriptionEmailReportDate')
    validateTime({ day, month, year, time }, errorSummary, 'the', ' the email was received', '#descriptionEmailReportTime')
  }
}

const validateReporterTab = (payload, errorSummary) => {
  const fifty = 50
  const sixty = 60
  // Validate reporter name length
  validateReporterName(payload, errorSummary)

  // Validate reporter tab email
  validateReporterEmail(payload, errorSummary)

  // Validate phone number
  validatePhone(payload, errorSummary)

  if (payload.reporterReference?.length > fifty) {
    errorSummary.errorList.push({
      text: 'Reporter\'s reference must be 50 characters or less',
      href: '#reporterReference'
    })
  }

  if (!payload.reporterType) {
    errorSummary.errorList.push({
      text: 'Select the type of reporter',
      href: '#reporterType'
    })
  } else if (payload.reporterType === 'water' && !payload.reporterWaterName) {
    errorSummary.errorList.push({
      text: 'Select a water company',
      href: '#reporterWaterName'
    })
  } else if (payload.reporterType === 'other') {
    if (!payload.reporterOtherName) {
      errorSummary.errorList.push({
        text: 'Enter an organisation name',
        href: '#reporterOtherName'
      })
    } else if (payload.reporterOtherName.length > fifty) {
      errorSummary.errorList.push({
        text: 'Organisation name must be 50 characters or less',
        href: '#reporterOtherName'
      })
    } else {
      // do nothing
    }

    if (payload.reporterRole?.length > sixty) {
      errorSummary.errorList.push({
        text: 'Reporter role or job title must be 60 characters or less',
        href: '#reporterRole'
      })
    }
  } else {
    // do nothing
  }
}

const validateLocationTab = (payload, errorSummary) => {
  // Do location validation
  if (!payload.locationOfIncident) {
    errorSummary.errorList.push({
      text: 'Select how you want to give a location',
      href: '#locationOfIncident'
    })
  }

  if (payload.locationOfIncident === 'gridReference') {
    validateGridReferenceLocation(payload, errorSummary)
  }

  if (payload.locationOfIncident === 'address') {
    validateAddressLocation(payload, errorSummary)
  }
}

const validateGridReferenceLocation = (payload, errorSummary) => {
  const locationDescriptionMax = 150
  if (!payload.locationGridRef) {
    errorSummary.errorList.push({
      text: 'Enter a national grid reference',
      href: '#locationGridRef'
    })
  } else if (!validateGridReference(payload.locationGridRef)) {
    errorSummary.errorList.push({
      text: 'Enter a full, 12-character national grid reference, like SP 23916 82277',
      href: '#locationGridRef'
    })
  } else {
    // do nothing
  }

  if (getTextAreaLength(payload.locationDescription) > locationDescriptionMax) {
    errorSummary.errorList.push({
      text: 'Location description must be 150 characters or less',
      href: '#locationDescription'
    })
  }
}

const validateAddressLocation = (payload, errorSummary) => {
  if (!payload.addressChosen) {
    validateBuildingData(payload, errorSummary)

    if (payload.buildingDetails && payload.postcodeDetails && !payload.addressId) {
      errorSummary.errorList.push({
        text: 'Select an address',
        href: '#addressId'
      })
    }
  }
}

const validateBuildingData = (payload, errorSummary) => {
  if (payload.locationOfIncident === 'address') {
    const postcodeDetails = '#postcodeDetails'

    if (!payload.postcodeDetails) {
      errorSummary.errorList.push({
        text: 'Enter a postcode',
        href: postcodeDetails
      })
    } else if (!postcodeRegExp.test(payload.postcodeDetails)) {
      errorSummary.errorList.push({
        text: 'Enter a full postcode, for example W1 8QS',
        href: postcodeDetails
      })
    } else {
      // do nothing
    }
  }
}

const validateAddressSelection = (payload, errorSummary) => {
  if (!payload.addressId) {
    errorSummary.errorList.push({
      text: 'Select an address',
      href: '#addressId'
    })
  }
}

const validateDateTab = (payload, errorSummary) => {
  const dateObservedRef = '#dateObserved'
  if (!payload.dateObserved) {
    errorSummary.errorList.push({
      text: 'Select a date',
      href: dateObservedRef
    })
  } else if (payload.dateObserved !== 'now') {
    let day, month, year, time, dateHref, timeHref
    // Set dates for today and yesterday options
    if (payload.dateObserved !== 'before') {
      dateHref = dateObservedRef
      const date = new Date()
      if (payload.dateObserved === 'today') {
        timeHref = '#dateTimeToday'
        time = payload.dateTimeToday
      }
      if (payload.dateObserved === 'yesterday') {
        timeHref = '#dateTimeYesterday'
        time = payload.dateTimeYesterday
        date.setDate(date.getDate() - 1)
      }
      day = date.getDate().toString()
      month = (date.getMonth() + 1).toString()
      year = date.getFullYear().toString()
    } else {
      dateHref = '#dateOther'
      timeHref = '#dateOtherTime'
      day = payload.dateOtherDay
      month = payload.dateOtherMonth
      year = payload.dateOtherYear
      time = payload.dateOtherTime
    }

    validateDate({ day, month, year }, errorSummary, 'a', '', dateHref)
    validateTime({ day, month, year, time }, errorSummary, 'a', '', timeHref)
  } else {
    // do nothing
  }

  // validate if date/time of incident is before date/time reported by email
  validateDateofIncident(payload, errorSummary)
}

const validateDate = (dateparts, errorSummary, aOrThe, errorMsgPostfix, href) => {
  // Validation for date of email
  const zero = 0
  const maxMonths = 12
  const maxDays = 31
  const firstValidYear = 1900
  const latestYear = 3000
  const validDay = dateparts.day > zero && dateparts.day <= maxDays
  const validMonth = dateparts.month > zero && dateparts.month <= maxMonths
  const validYear = dateparts.year > firstValidYear && dateparts.year < latestYear
  const validDayOnly = validDay && !validMonth && !validYear
  const validMonthOnly = !validDay && validMonth && !validYear
  const validYearOnly = !validDay && !validMonth && validYear
  const validMonthAndYear = !validDay && validMonth && validYear
  const validDayAndYear = validDay && !validMonth && validYear
  const validDayAndMonth = validDay && validMonth && !validYear
  let dateString
  let validDate = false
  let isPastDate = false
  if (validDay && validMonth && validYear) {
    dateString = `${dateparts.year}-${dateparts.month?.padStart(2, '0')}-${dateparts.day?.padStart(2, '0')}`
    validDate = moment(dateString, 'YYYY-MM-DD').isValid()
    const dateToCheck = moment(dateString)
    const today = moment().startOf('day')
    isPastDate = dateToCheck.isSame(today, 'day') || dateToCheck.isBefore(today)
  }
  const inValidDate = dateparts.day && dateparts.month && dateparts.year && !validDate
  if (!dateparts.day && !dateparts.month && !dateparts.year) {
    errorMsg(`Enter ${aOrThe} date${errorMsgPostfix}`, errorSummary, `${href}Day`)
  } else if (!dateparts.day && dateparts.month && dateparts.year) {
    errorMsg(`Enter ${aOrThe} day${errorMsgPostfix}`, errorSummary, `${href}Day`)
  } else if (dateparts.day && !dateparts.month && dateparts.year) {
    errorMsg(`Enter ${aOrThe} month${errorMsgPostfix}`, errorSummary, `${href}Month`)
  } else if (dateparts.day && dateparts.month && !dateparts.year) {
    errorMsg(`Enter ${aOrThe} year${errorMsgPostfix}`, errorSummary, `${href}Year`)
  } else if (!dateparts.day && !dateparts.month && dateparts.year) {
    errorMsg(`Enter ${aOrThe} day and month${errorMsgPostfix}`, errorSummary, `${href}Day`)
  } else if (dateparts.day && !dateparts.month && !dateparts.year) {
    errorMsg(`Enter ${aOrThe} month and year${errorMsgPostfix}`, errorSummary, `${href}Month`)
  } else if (!dateparts.day && dateparts.month && !dateparts.year) {
    errorMsg(`Enter ${aOrThe} day and year${errorMsgPostfix}`, errorSummary, `${href}Day`)
  } else if (validMonthAndYear) {
    errorMsg('Enter a day from 1 to 31', errorSummary, `${href}Day`)
  } else if (validDayAndYear) {
    errorMsg('Enter a month using numbers 1 to 12', errorSummary, `${href}Month`)
  } else if (validDayAndMonth) {
    errorMsg('Enter a full year, for example 2024', errorSummary, `${href}Year`)
  } else if (validDayOnly || validMonthOnly || validYearOnly || inValidDate) {
    errorMsg('The date entered must be a real date', errorSummary, `${href}Day`)
  } else if (validDate && validDay && validMonth && validYear && !isPastDate) {
    errorMsg('Date must be in the past', errorSummary, `${href}Day`)
  } else {
    // do nothing (blame sonarcloud)
  }
}

const validateTime = (dateparts, errorSummary, aOrThe, errorMsgPostfix, href) => {
  // Validation for time of email
  const zero = 0
  const maxMonths = 12
  const maxDays = 31
  const firstValidYear = 1900
  const latestYear = 3000
  const validDay = dateparts.day > zero && dateparts.day <= maxDays
  const validMonth = dateparts.month > zero && dateparts.month <= maxMonths
  const validYear = dateparts.year > firstValidYear && dateparts.year < latestYear

  if (!dateparts.time) {
    errorMsg(`Enter ${aOrThe} time${errorMsgPostfix}`, errorSummary, href)
    return
  }

  const formattedTime = formatTime24hr(dateparts.time)
  const validTimeFormat = formattedTime !== 'INVALID_TIME_FORMAT'

  let dateString
  let validDate = false
  if (validDay && validMonth && validYear) {
    dateString = `${dateparts.year}-${dateparts.month?.padStart(2, '0')}-${dateparts.day?.padStart(2, '0')}`
    validDate = moment(dateString, 'YYYY-MM-DD').isValid()
  }

  if (!validTimeFormat) {
    errorMsg('Enter a time using the 24-hour clock, from 00:00 for midnight, to 23:59', errorSummary, href)
  } else if (validDate) {
    const dateTimeString = `${dateparts.year}-${dateparts.month.padStart(2, '0')}-${dateparts.day.padStart(2, '0')} ${formattedTime}`
    const dateTime = moment(dateTimeString, 'YYYY-MM-DD HH:mm')
    const isDateTimeInPast = dateTime.isBefore(moment())
    if (!isDateTimeInPast) {
      errorMsg('Time must be in the past', errorSummary, href)
    }
  } else {
    // do nothing
  }
}

const errorMsg = (text, errorSummary, href) => {
  errorSummary.errorList.push({
    text,
    href
  })
}

const validateReporterName = (payload, errorSummary) => {
  const twenty = 20
  const forty = 40
  // validate length of first name
  if (payload.reporterFirstName && payload.reporterFirstName.length > twenty) {
    errorSummary.errorList.push({
      text: 'First name must be 20 characters or less',
      href: '#reporterFirstName'
    })
  }

  // validate length of last name
  if (payload.reporterLastName && payload.reporterLastName.length > forty) {
    errorSummary.errorList.push({
      text: 'Last name must be 40 characters or less',
      href: '#reporterLastName'
    })
  }
}

const validateReporterEmail = (payload, errorSummary) => {
  const validEmail = validateEmail(payload.reporterEmail)
  const invalidEmail = Boolean(payload.reporterEmail) && !validEmail
  const hasMediaSelection = payload.reporterPhotos === 'Yes' || payload.reporterVideos === 'Yes'
  const emailId = '#reporterEmail'
  if (hasMediaSelection) {
    if (!payload.reporterEmail) {
      errorSummary.errorList.push({
        text: 'Enter an email address',
        href: emailId
      })
    } else if (invalidEmail) {
      errorSummary.errorList.push({
        text: 'Enter an email address in the correct format, like name@example.com',
        href: emailId
      })
    } else {
      // do nothing
    }
  } else if (invalidEmail) {
    errorSummary.errorList.push({
      text: 'Enter an email address in the correct format, like name@example.com',
      href: emailId
    })
  } else {
    // Do nothing
  }
}

const validatePhone = (payload, errorSummary) => {
  if (payload.reporterPhone && !phoneRegex.test(payload.reporterPhone)) {
    errorSummary.errorList.push({
      text: 'Enter a phone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192',
      href: '#reporterPhone'
    })
  }
}

const validateDateofIncident = (payload, errorSummary) => {
  if (payload.descriptionReportedByEmail === 'true' && payload.dateObserved) {
    const dateTimeReportedByEmail = `${payload.descriptionEmailReportDateYear}-${payload.descriptionEmailReportDateMonth?.padStart(2, '0')}-${payload.descriptionEmailReportDateDay?.padStart(2, '0')} ${payload.descriptionEmailReportTime}`
    let dateTimeOfIncident
    const date = new Date()
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    if (payload.dateObserved === 'now') {
      dateTimeOfIncident = `${year}-${month}-${day} ${payload.nowTime}`
    } else if (payload.dateObserved === 'today') {
      dateTimeOfIncident = `${year}-${month}-${day} ${payload.dateTimeToday}`
    } else if (payload.dateObserved === 'yesterday') {
      dateTimeOfIncident = `${year}-${month}-${day - 1} ${payload.dateTimeYesterday}`
    } else if (payload.dateObserved === 'before') {
      dateTimeOfIncident = `${payload.dateOtherYear}-${payload.dateOtherMonth?.padStart(2, '0')}-${payload.dateOtherDay?.padStart(2, '0')} ${payload.dateOtherTime}`
    } else {
      // do nothing
    }
    const dateTimeFormat = 'YYYY-MM-DD hh:mm'
    const emailDate = moment(dateTimeReportedByEmail, dateTimeFormat)
    const incidentDate = moment(dateTimeOfIncident, dateTimeFormat)

    if (emailDate.isBefore(incidentDate)) {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const dateMissMatchError = `The time of incident must be before ${payload.descriptionEmailReportDateDay} ${months[(Number(payload.descriptionEmailReportDateMonth)) - 1]} ${payload.descriptionEmailReportDateYear} ${payload.descriptionEmailReportTime}`
      errorSummary.errorList.push({
        text: dateMissMatchError,
        href: '#dateObserved'
      })
    }
  }
}

const validateGridReference = gridRef => {
  return gridRefRegexWs.test(gridRef) || gridRefRegexWos.test(gridRef)
}

const formatGridReference = gridRef => {
  const formatRegex = /^([THJONSthjons][VWXYZQRSTULMNOPFGHJKABCDEvwxyzqrstulmnopfghjkabcde])(\d{5})(\d{5})$/
  if (formatRegex.test(gridRef)) {
    return gridRef.replace(formatRegex, '$1 $2 $3')
  }
  return gridRef
}

const formatTextarea = (payload) => {
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'descriptionDescription' || key === 'locationDescription') {
      payload[key] = value.replace(/\r\n/g, '&#13;&#10;')
    }
  }
  return payload
}

export {
  getErrorSummary,
  validatePayload,
  validateReportPayload,
  validateBuildingDataPayload,
  validateAddressSelectionPayload,
  validateGridReference,
  formatGridReference,
  formatTextarea
}
