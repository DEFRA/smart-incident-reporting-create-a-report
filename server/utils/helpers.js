import fs from 'fs'
import constants from './constants.js'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import dirname from '../../dirname.cjs'
import moment from 'moment'
// import * as dateHelpers from '@defra/smart-incident-reporting/server/utils/date-helpers.js'

// Based on OS Grid ref regex: https://gist.github.com/simonjgreen/44739fe52a8b68d8128e1237f8b3dfcd
// Grid ref regex with spaces
const gridRefRegexWs = /^([STNHOstnho][A-Za-z]\s)(\d{5}\s\d{5})$/
// Grid ref regex without spaces
const gridRefRegexWos = /^([STNHOstnho][A-Za-z])(\d{5}\d{5})$/

const postcodeRegExp = /^([A-Za-z][A-Ha-hJ-Yj-y]?\d[A-Za-z0-9]? ?\d[A-Za-z]{2}|[Gg][Ii][Rr] ?0[Aa]{2})$/ // https://stackoverflow.com/a/51885364

const phoneRegex = /^[\s\d-+()#]*$/

const sirpSchema = JSON.parse(fs.readFileSync(`${dirname}/server/schemas/sirp-car-schema.json`))

const getErrorSummary = () => {
  return JSON.parse(JSON.stringify(constants.errorSummary))
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

const validateEmail = email => {
  const maxLength = 255
  const domainPartMaxLength = 63
  const tester = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/
  // https://en.wikipedia.org/wiki/Email_address  The format of an email address is local-part@domain, where the
  // local part may be up to 64 octets long and the domain may have a maximum of 255 octets.
  if (!email || email.length === 0 || email.length > maxLength) {
    return false
  }

  const emailParts = email.split('@')

  if (emailParts.length !== 2 || !tester.test(email)) {
    return false
  }

  const account = emailParts[0]
  const address = emailParts[1]
  if (account.length > 64 || address.length > maxLength) {
    return false
  }

  const domainParts = address.split('.')

  // https://en.wikipedia.org/wiki/Email_address#Domain
  // It must match the requirements for a hostname, a list of dot-separated DNS labels, each label being limited to a length of 63 characters
  const domainIssue = domainParts.some(part => {
    return part.length > domainPartMaxLength
  })

  return !domainIssue
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

const validateDescriptionTab = (payload, errorSummary) => {
  if (!payload.descriptionDescription) {
    errorSummary.errorList.push({
      text: 'Enter an incident description',
      href: '#descriptionDescription'
    })
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
  // Validate reporter name length
  validateReporterName(payload, errorSummary)

  // Validate reporter tab email
  validateReporterEmail(payload, errorSummary)

  // Validate phone number
  validatePhone(payload, errorSummary)

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
    }
    if (payload.reporterLastName && payload.reporterOtherName.length > fifty) {
      errorSummary.errorList.push({
        text: 'Organisation name must be 50 characters or less',
        href: '#reporterOtherName'
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
      text: 'Select the location of incident',
      href: '#locationOfIncident'
    })
  }

  if (payload.locationOfIncident === 'gridReference') {
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
  }

  if (payload.locationOfIncident === 'address' && !payload.addressChosen) {
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
    if (!payload.buildingDetails) {
      errorSummary.errorList.push({
        text: 'Enter a building number or name',
        href: '#buildingDetails'
      })
    }

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
      timeHref = '#dateTime'
      const date = new Date()
      if (payload.dateObserved === 'yesterday') {
        date.setDate(date.getDate() - 1)
      }
      day = date.getDate().toString()
      month = (date.getMonth() + 1).toString()
      year = date.getFullYear().toString()
      time = payload.dateTime
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
    errorMsg(`Enter ${aOrThe} date${errorMsgPostfix}`, errorSummary, href)
  } else if (!dateparts.day && dateparts.month && dateparts.year) {
    errorMsg(`Enter ${aOrThe} day${errorMsgPostfix}`, errorSummary, href)
  } else if (dateparts.day && !dateparts.month && dateparts.year) {
    errorMsg(`Enter ${aOrThe} month${errorMsgPostfix}`, errorSummary, href)
  } else if (dateparts.day && dateparts.month && !dateparts.year) {
    errorMsg(`Enter ${aOrThe} year${errorMsgPostfix}`, errorSummary, href)
  } else if (!dateparts.day && !dateparts.month && dateparts.year) {
    errorMsg(`Enter ${aOrThe} day and month${errorMsgPostfix}`, errorSummary, href)
  } else if (dateparts.day && !dateparts.month && !dateparts.year) {
    errorMsg(`Enter ${aOrThe} month and year${errorMsgPostfix}`, errorSummary, href)
  } else if (!dateparts.day && dateparts.month && !dateparts.year) {
    errorMsg(`Enter ${aOrThe} day and year${errorMsgPostfix}`, errorSummary, href)
  } else if (validMonthAndYear) {
    errorMsg('Enter a day from 1 to 31', errorSummary, href)
  } else if (validDayAndYear) {
    errorMsg('Enter a month using numbers 1 to 12', errorSummary, href)
  } else if (validDayAndMonth) {
    errorMsg('Enter a full year, for example 2024', errorSummary, href)
  } else if (validDayOnly || validMonthOnly || validYearOnly || inValidDate) {
    errorMsg('The date entered must be a real date', errorSummary, href)
  } else if (validDate && validDay && validMonth && validYear && !isPastDate) {
    errorMsg('Date must be in the past', errorSummary, href)
  } else {
    // do nothing (blame sonarcloud)
  }
}

const validateTime = (dateparts, errorSummary, aOrThe, errorMsgPostfix, href) => {
  // Validation for time of email
  const zero = 0
  const maxMinutes = 59
  const maxHours = 23
  const maxMonths = 12
  const maxDays = 31
  const firstValidYear = 1900
  const latestYear = 3000
  const validDay = dateparts.day > zero && dateparts.day <= maxDays
  const validMonth = dateparts.month > zero && dateparts.month <= maxMonths
  const validYear = dateparts.year > firstValidYear && dateparts.year < latestYear
  if (!dateparts.time) {
    errorMsg(`Enter ${aOrThe} time${errorMsgPostfix}`, errorSummary, href)
  } else {
    let validTimeFormat = false
    const maxTimeLength = 3
    if (moment(dateparts.time, 'HH:mm').isValid() && dateparts.time.length >= maxTimeLength) {
      const timeParts = dateparts.time.split(':')
      const hours = timeParts[0]?.padStart(2, '0')
      const minutes = timeParts[1]?.padStart(2, '0')
      validTimeFormat = timeParts.length === 2 && (hours >= zero && hours <= maxHours) && (minutes >= zero && minutes <= maxMinutes)
    }

    let dateString
    let validDate = false
    if (validDay && validMonth && validYear) {
      dateString = `${dateparts.year}-${dateparts.month?.padStart(2, '0')}-${dateparts.day?.padStart(2, '0')}`
      validDate = moment(dateString, 'YYYY-MM-DD').isValid()
    }

    if (!validTimeFormat) {
      errorMsg('Enter a time using the 24-hour clock, from 00:00 for midnight, to 23:59', errorSummary, href)
    } else if (validTimeFormat && validDay && validMonth && validYear && validDate) {
      const dateTimeString = `${dateparts.year}-${dateparts.month.padStart(2, '0')}-${dateparts.day.padStart(2, '0')} ${dateparts.time}`
      const dateTime = moment(dateTimeString, 'YYYY-MM-DD hh:mm')
      const maxAgeMinutes = 5
      const isDateTimeInPast = dateTime.isBefore(moment().subtract(maxAgeMinutes, 'minutes'))
      if (!isDateTimeInPast) {
        errorMsg('Time must be in the past', errorSummary, href)
      }
    } else {
      // do nothing
    }
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
  const emailId = '#reporterEmail'
  if (payload.reporterPhotos === 'Yes') {
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
  } else if ((!payload.reporterPhotos || payload.reporterPhotos === 'No') && invalidEmail) {
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
      dateTimeOfIncident = `${year}-${month}-${day} ${payload.dateTime}`
    } else if (payload.dateObserved === 'yesterday') {
      dateTimeOfIncident = `${year}-${month}-${day - 1} ${payload.dateTime}`
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

export {
  getErrorSummary,
  validatePayload,
  validateEmail,
  validateReportPayload,
  validateBuildingDataPayload,
  validateAddressSelectionPayload,
  validateGridReference,
  formatGridReference
}
