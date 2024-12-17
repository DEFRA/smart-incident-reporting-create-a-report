import constants from './constants.js'
import moment from 'moment'
// import {
//   dateValidateAndError,
//   fieldErrorClasses,
//   getDateErrors,
//   getTimeErrors,
//   validatePayload
// } from '@defra/smart-incident-reporting/server/utils/date-helpers.js'

// OS Grid ref regex: https://gist.github.com/simonjgreen/44739fe52a8b68d8128e1237f8b3dfcd
const gridRefRegex = /^([STNHOstnho][A-Za-z]\s?)(\d{5}\s?\d{5}|\d{4}\s?\d{4}|\d{3}\s?\d{3}|\d{2}\s?\d{2}|\d{1}\s?\d{1})$/

const getErrorSummary = () => {
  return JSON.parse(JSON.stringify(constants.errorSummary))
}

// Borrowed from https://github.com/DEFRA/biodiversity-net-gain-service/blob/master/packages/webapp/src/utils/helpers.js#L487
const validateEmail = email => {
  const maxLength = 255
  const domainPartMaxLength = 63
  const tester = /^[-!#$%&'*+\0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/
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
  validateDescription(payload, errorSummary)
  validateLocation(payload, errorSummary)

  return errorSummary
}

const validateDescription = (payload, errorSummary) => {
  if (!payload.descriptionDescription) {
    errorSummary.description.errorList.push({
      text: 'Enter an incident description',
      href: '#descriptionDescription'
    })
  }

  if (!payload.descriptionIncidentType) {
    errorSummary.description.errorList.push({
      text: 'Select an incident type',
      href: '#descriptionIncidentType'
    })
  }

  if (payload.descriptionReportedByEmail) {
    validateDateOfEmail(payload, errorSummary)
    validateTimeOfEmail(payload, errorSummary)
  }
}

const validateLocation = (payload, errorSummary) => {
  // Do location validation
  if (!payload.locationGridRef) {
    errorSummary.location.errorList.push({
      text: 'Enter a national grid reference',
      href: '#locationGridRef'
    })
  } else if (!validateGridReference(payload.locationGridRef)) {
    errorSummary.location.errorList.push({
      text: 'Enter a national grid reference, like SD661501',
      href: '#locationGridRef'
    })
  } else {
    // do nothing (blame sonarcloud)
  }
}

const validateDateOfEmail = (payload, errorSummary) => {
  // Validation for date of email
  const zero = 0
  const maxMonths = 12
  const maxDays = 31
  const firstValidYear = 1900
  const latestYear = 3000
  const day = payload.descriptionEmailReportDateDay
  const month = payload.descriptionEmailReportDateMonth
  const year = payload.descriptionEmailReportDateYear
  const validDay = day > zero && day <= maxDays
  const validMonth = month > zero && month <= maxMonths
  const validYear = year > firstValidYear && year < latestYear
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
    dateString = `${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`
    validDate = moment(dateString, 'YYYY-MM-DD').isValid()
    const dateToCheck = moment(dateString)
    const today = moment().startOf('day')
    isPastDate = dateToCheck.isSame(today, 'day') || dateToCheck.isBefore(today)
  }
  const inValidDate = day && month && year && !validDate
  if (!day && !month && !year) {
    dateErrorMsg('Enter the date the email was received', errorSummary)
  } else if (!day && month && year) {
    dateErrorMsg('Enter the day the email was received', errorSummary)
  } else if (day && !month && year) {
    dateErrorMsg('Enter the month the email was received', errorSummary)
  } else if (day && month && !year) {
    dateErrorMsg('Enter the year the email was received', errorSummary)
  } else if (!day && !month && year) {
    dateErrorMsg('Enter the day and month the email was received', errorSummary)
  } else if (day && !month && !year) {
    dateErrorMsg('Enter the month and year the email was received', errorSummary)
  } else if (!day && month && !year) {
    dateErrorMsg('Enter the day and year the email was received', errorSummary)
  } else if (validMonthAndYear) {
    dateErrorMsg('Enter a day from 1 to 31', errorSummary)
  } else if (validDayAndYear) {
    dateErrorMsg('Enter a month using numbers 1 to 12', errorSummary)
  } else if (validDayAndMonth) {
    dateErrorMsg('Enter a full year, for example 2024', errorSummary)
  } else if (validDayOnly || validMonthOnly || validYearOnly || inValidDate) {
    dateErrorMsg('The date entered must be a real date', errorSummary)
  } else if (validDate && validDay && validMonth && validYear && !isPastDate) {
    dateErrorMsg('Date must be in the past', errorSummary)
  } else {
    // do nothing (blame sonarcloud)
  }
}

const validateTimeOfEmail = (payload, errorSummary) => {
  // Validation for time of email
  const zero = 0
  const maxMinutes = 59
  const maxHours = 23
  const maxMonths = 12
  const maxDays = 31
  const firstValidYear = 1900
  const latestYear = 3000
  const day = payload.descriptionEmailReportDateDay
  const month = payload.descriptionEmailReportDateMonth
  const year = payload.descriptionEmailReportDateYear
  const validDay = day > zero && day <= maxDays
  const validMonth = month > zero && month <= maxMonths
  const validYear = year > firstValidYear && year < latestYear
  if (!payload.descriptionEmailReportTime) {
    timeErrorMsg('Enter the time the email was received', errorSummary)
  } else {
    let validTimeFormat = false
    const maxTimeLength = 3
    const time = payload.descriptionEmailReportTime
    if (moment(time, 'HH:mm').isValid() && time.length >= maxTimeLength) {
      const timeParts = time.split(':')
      const hours = timeParts[0]?.padStart(2, '0')
      const minutes = timeParts[1]?.padStart(2, '0')
      validTimeFormat = timeParts.length === 2 && (hours >= zero && hours <= maxHours) && (minutes >= zero && minutes <= maxMinutes)
    }

    let dateString
    let validDate = false
    if (validDay && validMonth && validYear) {
      dateString = `${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`
      validDate = moment(dateString, 'YYYY-MM-DD').isValid()
    }

    if (!validTimeFormat) {
      timeErrorMsg('Enter a time using the 24-hour clock, from 00:00 for midnight, to 23:59', errorSummary)
    } else if (validTimeFormat && validDay && validMonth && validYear && validDate) {
      const dateTimeString = `${payload.descriptionEmailReportDateYear}-${payload.descriptionEmailReportDateMonth.padStart(2, '0')}-${payload.descriptionEmailReportDateDay.padStart(2, '0')} ${payload.descriptionEmailReportTime}`
      const dateTime = moment(dateTimeString, 'YYYY-MM-DD hh:mm')
      const maxAgeMinutes = 5
      const isDateTimeInPast = dateTime.isBefore(moment().subtract(maxAgeMinutes, 'minutes'))
      if (!isDateTimeInPast) {
        timeErrorMsg('Time must be in the past', errorSummary)
      }
    } else {
      // do nothing
    }
  }
}

const dateErrorMsg = (errMsg, errorSummary) => {
  errorSummary.description.errorList.push({
    text: errMsg,
    href: '#descriptionEmailReportDate'
  })
}

const timeErrorMsg = (errMsg, errorSummary) => {
  errorSummary.description.errorList.push({
    text: errMsg,
    href: '#descriptionEmailReportTime'
  })
}

const validateGridReference = gridRef => {
  return gridRefRegex.test(gridRef)
}

export {
  getErrorSummary,
  validateEmail,
  validateReportPayload,
  validateGridReference
}
