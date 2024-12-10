import constants from './constants.js'
import moment from 'moment'

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
  const description = getErrorSummary()
  const reporter = getErrorSummary()
  const location = getErrorSummary()
  const date = getErrorSummary()

  // Do description validation
  if (!payload.descriptionDescription) {
    description.errorList.push({
      text: 'Enter an incident description',
      href: '#descriptionDescription'
    })
  }

  if (!payload.descriptionIncidentType) {
    description.errorList.push({
      text: 'Select an incident type',
      href: '#descriptionIncidentType'
    })
  }

  if (payload.descriptionReportedByEmail) {
    // Validation for date of email
    const day = payload.descriptionEmailReportDateDay
    const month = payload.descriptionEmailReportDateMonth
    const year = payload.descriptionEmailReportDateYear
    const validDay = day > 0 && day <= 31
    const validMonth = month > 0 && month <= 12
    const validYear = year > 1900 && year < 3000
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
    if (!day && !month && !year) {
      description.errorList.push({
        text: 'Enter the date the email was received',
        href: '#descriptionEmailReportDate'
      })
    } else if (validDate && validDay && validMonth && validYear && !isPastDate) {
      description.errorList.push({
        text: 'Date must be in the past',
        href: '#descriptionEmailReportDate'
      })
    } else if (!day && month && year) {
      description.errorList.push({
        text: 'Enter the day the email was received',
        href: '#descriptionEmailReportDate'
      })
    } else if (day && !month && year) {
      description.errorList.push({
        text: 'Enter the month the email was received',
        href: '#descriptionEmailReportDate'
      })
    } else if (day && month && !year) {
      description.errorList.push({
        text: 'Enter the year the email was received',
        href: '#descriptionEmailReportDate'
      })
    } else if (!day && !month && year) {
      description.errorList.push({
        text: 'Enter the day and month the email was received',
        href: '#descriptionEmailReportDate'
      })
    } else if (day && !month && !year) {
      description.errorList.push({
        text: 'Enter the month and year the email was received',
        href: '#descriptionEmailReportDate'
      })
    } else if (!day && month && !year) {
      description.errorList.push({
        text: 'Enter the day and year the email was received',
        href: '#descriptionEmailReportDate'
      })
    } else if (!validDay && validMonth && validYear) {
      description.errorList.push({
        text: 'Enter a day from 1 to 31',
        href: '#descriptionEmailReportDate'
      })
    } else if (validDay && !validMonth && validYear) {
      description.errorList.push({
        text: 'Enter a month using numbers 1 to 12',
        href: '#descriptionEmailReportDate'
      })
    } else if (validDay && validMonth && !validYear) {
      description.errorList.push({
        text: 'Enter a full year, for example 2024',
        href: '#descriptionEmailReportDate'
      })
    } else if (!validDay && !validMonth && validYear) {
      description.errorList.push({
        text: 'The date entered must be a real date',
        href: '#descriptionEmailReportDate'
      })
    } else if (validDay && !validMonth && !validYear) {
      description.errorList.push({
        text: 'The date entered must be a real date',
        href: '#descriptionEmailReportDate'
      })
    } else if (!validDay && validMonth && !validYear) {
      description.errorList.push({
        text: 'The date entered must be a real date',
        href: '#descriptionEmailReportDate'
      })
    } else if (day && month && year && !validDate) {
      description.errorList.push({
        text: 'The date entered must be a real date',
        href: '#descriptionEmailReportDate'
      })
    }

    // Validation for time of email
    if (!payload.descriptionEmailReportTime) {
      description.errorList.push({
        text: 'Enter the time the email was received',
        href: '#descriptionEmailReportTime'
      })
    } else {
      let validTimeFormat = false
      const time = payload.descriptionEmailReportTime
      if (moment(time, 'HH:mm').isValid() && time.length >= 3) {
        const timeParts = time.split(':')
        const hours = timeParts[0]?.padStart(2, '0')
        const minutes = timeParts[1]?.padStart(2, '0')
        validTimeFormat = timeParts.length === 2 && (hours >= 0 && hours <= 23) && (minutes >= 0 && minutes <= 59)
      }

      if (!validTimeFormat) {
        description.errorList.push({
          text: 'Enter a time using the 24-hour clock, from 00:00 for midnight, to 23:59',
          href: '#descriptionEmailReportTime'
        })
      }

      if (validTimeFormat && validDay && validMonth && validYear && validDate) {
        const dateTimeString = `${payload.descriptionEmailReportDateYear}-${payload.descriptionEmailReportDateMonth.padStart(2, '0')}-${payload.descriptionEmailReportDateDay.padStart(2, '0')} ${payload.descriptionEmailReportTime}`
        const dateTime = moment(dateTimeString, 'YYYY-MM-DD hh:mm')
        const isDateTimeInPast = dateTime.isBefore(moment().subtract(5, 'minutes'))
        if (validTimeFormat && !isDateTimeInPast) {
          description.errorList.push({
            text: 'Time must be in the past',
            href: '#descriptionEmailReportTime'
          })
        }
      }
    }
  }

  // Do reporter validation

  // Do location validation
  if (!payload.locationGridRef) {
    location.errorList.push({
      text: 'Enter a national grid reference',
      href: '#locationGridRef'
    })
  } else if (!validateGridReference(payload.locationGridRef)) {
    location.errorList.push({
      text: 'Enter a national grid reference, like SD661501',
      href: '#locationGridRef'
    })
  } else {
    // do nothing (blame sonarcloud)
  }

  // Do date validation

  return {
    description,
    reporter,
    location,
    date
  }
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
