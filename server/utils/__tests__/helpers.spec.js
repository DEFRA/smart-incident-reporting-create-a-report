import {
  validateReportPayload,
  validateGridReference,
  formatGridReference
} from '../helpers.js'

describe('helpers', () => {
  describe('validateGridReference', () => {
    it('should return true for valid grid reference with spaces', () => {
      expect(validateGridReference('SP 23916 82277')).toBe(true)
    })

    it('should return true for valid grid reference without spaces', () => {
      expect(validateGridReference('SP2391682277')).toBe(true)
    })

    it('should return false for invalid grid reference', () => {
      expect(validateGridReference('INVALID')).toBe(false)
    })
  })

  describe('formatGridReference', () => {
    it('should format grid reference without spaces', () => {
      expect(formatGridReference('SP2391682277')).toBe('SP 23916 82277')
    })

    it('should return original if already formatted', () => {
      expect(formatGridReference('SP 23916 82277')).toBe('SP 23916 82277')
    })
  })

  describe('validateReportPayload - date validation', () => {
    const getBasePayload = () => ({
      descriptionDescription: 'Test description',
      descriptionIncidentType: '100',
      reporterFirstName: 'John',
      reporterLastName: 'Doe',
      reporterType: 'public',
      locationOfIncident: 'gridReference',
      locationGridRef: 'SP 23916 82277',
      dateObserved: 'now',
      reporterPhotos: 'No'
    })

    describe('email report date validation', () => {
      it('should error with Day href when all date fields are empty', () => {
        const payload = {
          ...getBasePayload(),
          descriptionReportedByEmail: 'true',
          descriptionEmailReportDateDay: '',
          descriptionEmailReportDateMonth: '',
          descriptionEmailReportDateYear: '',
          descriptionEmailReportTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'Enter the date the email was received',
          href: '#descriptionEmailReportDateDay'
        })
      })

      it('should error with Day href when only day is missing', () => {
        const payload = {
          ...getBasePayload(),
          descriptionReportedByEmail: 'true',
          descriptionEmailReportDateDay: '',
          descriptionEmailReportDateMonth: '05',
          descriptionEmailReportDateYear: '2025',
          descriptionEmailReportTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'Enter the day the email was received',
          href: '#descriptionEmailReportDateDay'
        })
      })

      it('should error with Month href when only month is missing', () => {
        const payload = {
          ...getBasePayload(),
          descriptionReportedByEmail: 'true',
          descriptionEmailReportDateDay: '10',
          descriptionEmailReportDateMonth: '',
          descriptionEmailReportDateYear: '2025',
          descriptionEmailReportTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'Enter the month the email was received',
          href: '#descriptionEmailReportDateMonth'
        })
      })

      it('should error with Year href when only year is missing', () => {
        const payload = {
          ...getBasePayload(),
          descriptionReportedByEmail: 'true',
          descriptionEmailReportDateDay: '10',
          descriptionEmailReportDateMonth: '05',
          descriptionEmailReportDateYear: '',
          descriptionEmailReportTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'Enter the year the email was received',
          href: '#descriptionEmailReportDateYear'
        })
      })

      it('should error with Month href when month and year are missing', () => {
        const payload = {
          ...getBasePayload(),
          descriptionReportedByEmail: 'true',
          descriptionEmailReportDateDay: '10',
          descriptionEmailReportDateMonth: '',
          descriptionEmailReportDateYear: '',
          descriptionEmailReportTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'Enter the month and year the email was received',
          href: '#descriptionEmailReportDateMonth'
        })
      })

      it('should error with Day href when day and year are missing', () => {
        const payload = {
          ...getBasePayload(),
          descriptionReportedByEmail: 'true',
          descriptionEmailReportDateDay: '',
          descriptionEmailReportDateMonth: '05',
          descriptionEmailReportDateYear: '',
          descriptionEmailReportTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'Enter the day and year the email was received',
          href: '#descriptionEmailReportDateDay'
        })
      })

      it('should error with Day href when day and month are missing', () => {
        const payload = {
          ...getBasePayload(),
          descriptionReportedByEmail: 'true',
          descriptionEmailReportDateDay: '',
          descriptionEmailReportDateMonth: '',
          descriptionEmailReportDateYear: '2025',
          descriptionEmailReportTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'Enter the day and month the email was received',
          href: '#descriptionEmailReportDateDay'
        })
      })

      it('should error with Day href when day is invalid', () => {
        const payload = {
          ...getBasePayload(),
          descriptionReportedByEmail: 'true',
          descriptionEmailReportDateDay: '55',
          descriptionEmailReportDateMonth: '05',
          descriptionEmailReportDateYear: '2025',
          descriptionEmailReportTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'Enter a day from 1 to 31',
          href: '#descriptionEmailReportDateDay'
        })
      })

      it('should error with Month href when month is invalid', () => {
        const payload = {
          ...getBasePayload(),
          descriptionReportedByEmail: 'true',
          descriptionEmailReportDateDay: '10',
          descriptionEmailReportDateMonth: '55',
          descriptionEmailReportDateYear: '2025',
          descriptionEmailReportTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'Enter a month using numbers 1 to 12',
          href: '#descriptionEmailReportDateMonth'
        })
      })

      it('should error with Year href when year is invalid', () => {
        const payload = {
          ...getBasePayload(),
          descriptionReportedByEmail: 'true',
          descriptionEmailReportDateDay: '10',
          descriptionEmailReportDateMonth: '05',
          descriptionEmailReportDateYear: '202',
          descriptionEmailReportTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'Enter a full year, for example 2024',
          href: '#descriptionEmailReportDateYear'
        })
      })

      it('should error with Day href when date is invalid', () => {
        const payload = {
          ...getBasePayload(),
          descriptionReportedByEmail: 'true',
          descriptionEmailReportDateDay: '31',
          descriptionEmailReportDateMonth: '02',
          descriptionEmailReportDateYear: '2025',
          descriptionEmailReportTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'The date entered must be a real date',
          href: '#descriptionEmailReportDateDay'
        })
      })

      it('should error with Day href when date is in the future', () => {
        const payload = {
          ...getBasePayload(),
          descriptionReportedByEmail: 'true',
          descriptionEmailReportDateDay: '10',
          descriptionEmailReportDateMonth: '05',
          descriptionEmailReportDateYear: '2099',
          descriptionEmailReportTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'Date must be in the past',
          href: '#descriptionEmailReportDateDay'
        })
      })
    })

    describe('date of incident validation', () => {
      it('should error with Day href when dateOther day is missing', () => {
        const payload = {
          ...getBasePayload(),
          dateObserved: 'before',
          dateOtherDay: '',
          dateOtherMonth: '05',
          dateOtherYear: '2025',
          dateOtherTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.date.errorList).toContainEqual({
          text: 'Enter a day',
          href: '#dateOtherDay'
        })
      })

      it('should error with Month href when dateOther month is missing', () => {
        const payload = {
          ...getBasePayload(),
          dateObserved: 'before',
          dateOtherDay: '10',
          dateOtherMonth: '',
          dateOtherYear: '2025',
          dateOtherTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.date.errorList).toContainEqual({
          text: 'Enter a month',
          href: '#dateOtherMonth'
        })
      })

      it('should error with Year href when dateOther year is missing', () => {
        const payload = {
          ...getBasePayload(),
          dateObserved: 'before',
          dateOtherDay: '10',
          dateOtherMonth: '05',
          dateOtherYear: '',
          dateOtherTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.date.errorList).toContainEqual({
          text: 'Enter a year',
          href: '#dateOtherYear'
        })
      })

      it('should error with Day href when dateOther day is invalid', () => {
        const payload = {
          ...getBasePayload(),
          dateObserved: 'before',
          dateOtherDay: '55',
          dateOtherMonth: '05',
          dateOtherYear: '2025',
          dateOtherTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.date.errorList).toContainEqual({
          text: 'Enter a day from 1 to 31',
          href: '#dateOtherDay'
        })
      })

      it('should error with Month href when dateOther month is invalid', () => {
        const payload = {
          ...getBasePayload(),
          dateObserved: 'before',
          dateOtherDay: '10',
          dateOtherMonth: '15',
          dateOtherYear: '2025',
          dateOtherTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.date.errorList).toContainEqual({
          text: 'Enter a month using numbers 1 to 12',
          href: '#dateOtherMonth'
        })
      })

      it('should error with Year href when dateOther year is invalid', () => {
        const payload = {
          ...getBasePayload(),
          dateObserved: 'before',
          dateOtherDay: '10',
          dateOtherMonth: '05',
          dateOtherYear: '202',
          dateOtherTime: '10:00'
        }

        const result = validateReportPayload(payload)

        expect(result.date.errorList).toContainEqual({
          text: 'Enter a full year, for example 2024',
          href: '#dateOtherYear'
        })
      })
    })

    describe('description validation', () => {
      it('should error when description is missing', () => {
        const payload = {
          ...getBasePayload(),
          descriptionDescription: ''
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'Enter an incident description',
          href: '#descriptionDescription'
        })
      })

      it('should error when incident type is missing', () => {
        const payload = {
          ...getBasePayload(),
          descriptionIncidentType: ''
        }

        const result = validateReportPayload(payload)

        expect(result.description.errorList).toContainEqual({
          text: 'Select an incident type',
          href: '#descriptionIncidentType'
        })
      })
    })

    describe('reporter validation', () => {
      it('should error when reporter type is missing', () => {
        const payload = {
          ...getBasePayload(),
          reporterType: ''
        }

        const result = validateReportPayload(payload)

        expect(result.reporter.errorList).toContainEqual({
          text: 'Select the type of reporter',
          href: '#reporterType'
        })
      })

      it('should error when first name exceeds 20 characters', () => {
        const payload = {
          ...getBasePayload(),
          reporterFirstName: 'a'.repeat(21)
        }

        const result = validateReportPayload(payload)

        expect(result.reporter.errorList).toContainEqual({
          text: 'First name must be 20 characters or less',
          href: '#reporterFirstName'
        })
      })

      it('should error when last name exceeds 40 characters', () => {
        const payload = {
          ...getBasePayload(),
          reporterLastName: 'a'.repeat(41)
        }

        const result = validateReportPayload(payload)

        expect(result.reporter.errorList).toContainEqual({
          text: 'Last name must be 40 characters or less',
          href: '#reporterLastName'
        })
      })

      it('should error when photos is Yes but email is missing', () => {
        const payload = {
          ...getBasePayload(),
          reporterPhotos: 'Yes',
          reporterEmail: ''
        }

        const result = validateReportPayload(payload)

        expect(result.reporter.errorList).toContainEqual({
          text: 'Enter an email address',
          href: '#reporterEmail'
        })
      })

      it('should error when email is invalid', () => {
        const payload = {
          ...getBasePayload(),
          reporterPhotos: 'Yes',
          reporterEmail: 'invalid-email'
        }

        const result = validateReportPayload(payload)

        expect(result.reporter.errorList).toContainEqual({
          text: 'Enter an email address in the correct format, like name@example.com',
          href: '#reporterEmail'
        })
      })
    })

    describe('location validation', () => {
      it('should error when location of incident is missing', () => {
        const payload = {
          ...getBasePayload(),
          locationOfIncident: ''
        }

        const result = validateReportPayload(payload)

        expect(result.location.errorList).toContainEqual({
          text: 'Select how you want to give a location',
          href: '#locationOfIncident'
        })
      })

      it('should error when grid reference is invalid', () => {
        const payload = {
          ...getBasePayload(),
          locationOfIncident: 'gridReference',
          locationGridRef: 'INVALID'
        }

        const result = validateReportPayload(payload)

        expect(result.location.errorList).toContainEqual({
          text: 'Enter a full, 12-character national grid reference, like SP 23916 82277',
          href: '#locationGridRef'
        })
      })
    })
  })
})
