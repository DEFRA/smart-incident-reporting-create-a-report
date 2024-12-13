import { submitGetRequest, submitPostRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'

const url = constants.routes.CREATE_A_REPORT

const payload = {
  dateObserved: 'before',
  dateOtherDay: '01',
  dateOtherMonth: '12',
  dateOtherTime: '09:00',
  dateOtherYear: '2024',
  dateTime: '',
  descriptionDescription: 'Incident description',
  descriptionEmailReportDateDay: '03',
  descriptionEmailReportDateMonth: '12',
  descriptionEmailReportDateYear: '2024',
  descriptionEmailReportTime: '08:00',
  descriptionIncidentType: '100',
  descriptionReportedByEmail: 'true',
  locationDescription: 'Location description',
  locationGridRef: 'SJ 67084 44110',
  reporterEmail: 'test@Test.com',
  reporterFirstName: 'John',
  reporterLastName: 'Smith',
  reporterPhone: '01234567890',
  reporterOrgType: 'water',
  reporterWaterName: 'Water Services Ltd',
  reporterPhotos: 'Yes'
}

describe(url, () => {
  describe('GET', () => {
    it(`Should return success response and correct view for ${url}`, async () => {
      const response = await submitGetRequest({ url })
      // Test for correct auth mock
      expect(response.payload).toContain('<p style="color: white;">Smith, John  <a href="/signout" class="govuk-link govuk-link--inverse govuk-!-margin-top-1">Sign out</a></p>')
    })
  })
  describe('POST', () => {
    it('Happy: should redirect to CHECK_AND_SUBMIT_REPORT if valid session', async () => {
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
    })
    it('Sad: should fail validation and return error message for missing grid reference', async () => {
      payload.locationGridRef = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#locationGridRef">Enter a national grid reference</a>')
    })
    it('Sad: should fail validation and return error message for missing grid reference', async () => {
      payload.locationGridRef = 'sdfdsgfdgdf'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#locationGridRef">Enter a national grid reference, like SD661501</a>')
    })
    it('Sad: should fail validation and return error message for missing incident description', async () => {
      payload.descriptionDescription = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionDescription">Enter an incident description</a>')
    })
    it('Sad: should fail validation and return error message for missing incident type', async () => {
      payload.descriptionIncidentType = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionIncidentType">Select an incident type</a>')
    })
    it('Sad: should fail validation and return error message for missing date of email fields', async () => {
      payload.descriptionEmailReportDateDay = ''
      payload.descriptionEmailReportDateMonth = ''
      payload.descriptionEmailReportDateYear = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">Enter the date the email was received</a>')
    })
    it('Sad: should fail validation and return error message for missing date of email fields', async () => {
      payload.descriptionEmailReportDateDay = ''
      payload.descriptionEmailReportDateMonth = ''
      payload.descriptionEmailReportDateYear = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">Enter the date the email was received</a>')
    })
    it('Sad: should fail validation and return error message for missing date of email - day field', async () => {
      payload.descriptionEmailReportDateDay = ''
      payload.descriptionEmailReportDateMonth = '05'
      payload.descriptionEmailReportDateYear = '2024'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">Enter the day the email was received</a>')
    })
    it('Sad: should fail validation and return error message for missing date of email - month field', async () => {
      payload.descriptionEmailReportDateDay = '10'
      payload.descriptionEmailReportDateMonth = ''
      payload.descriptionEmailReportDateYear = '2024'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">Enter the month the email was received</a>')
    })
    it('Sad: should fail validation and return error message for missing date of email - year field', async () => {
      payload.descriptionEmailReportDateDay = '10'
      payload.descriptionEmailReportDateMonth = '05'
      payload.descriptionEmailReportDateYear = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">Enter the year the email was received</a>')
    })
    it('Sad: should fail validation and return error message for missing date of email - month and year fields', async () => {
      payload.descriptionEmailReportDateDay = '01'
      payload.descriptionEmailReportDateMonth = ''
      payload.descriptionEmailReportDateYear = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">Enter the month and year the email was received</a>')
    })
    it('Sad: should fail validation and return error message for missing date of email - day and year fields', async () => {
      payload.descriptionEmailReportDateDay = ''
      payload.descriptionEmailReportDateMonth = '05'
      payload.descriptionEmailReportDateYear = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">Enter the day and year the email was received</a>')
    })
    it('Sad: should fail validation and return error message for missing date of email - day and month fields', async () => {
      payload.descriptionEmailReportDateDay = ''
      payload.descriptionEmailReportDateMonth = ''
      payload.descriptionEmailReportDateYear = '2024'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">Enter the day and month the email was received</a>')
    })
    it('Sad: should fail validation and return error message if date of email is not in the past', async () => {
      payload.descriptionEmailReportDateDay = '10'
      payload.descriptionEmailReportDateMonth = '05'
      payload.descriptionEmailReportDateYear = '2026'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">Date must be in the past</a>')
    })
    it('Sad: should fail validation and return error message if date of email - day is invalid', async () => {
      payload.descriptionEmailReportDateDay = '55'
      payload.descriptionEmailReportDateMonth = '05'
      payload.descriptionEmailReportDateYear = '2024'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">Enter a day from 1 to 31</a>')
    })
    it('Sad: should fail validation and return error message if date of email - month is invalid', async () => {
      payload.descriptionEmailReportDateDay = '05'
      payload.descriptionEmailReportDateMonth = '55'
      payload.descriptionEmailReportDateYear = '2024'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">Enter a month using numbers 1 to 12</a>')
    })
    it('Sad: should fail validation and return error message if date of email - year is invalid', async () => {
      payload.descriptionEmailReportDateDay = '05'
      payload.descriptionEmailReportDateMonth = '10'
      payload.descriptionEmailReportDateYear = '202'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">Enter a full year, for example 2024</a>')
    })
    it('Sad: should fail validation and return error message if date of email - day and month is invalid', async () => {
      payload.descriptionEmailReportDateDay = '35'
      payload.descriptionEmailReportDateMonth = '55'
      payload.descriptionEmailReportDateYear = '2024'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">The date entered must be a real date</a>')
    })
    it('Sad: should fail validation and return error message if date of email - month and year is invalid', async () => {
      payload.descriptionEmailReportDateDay = '15'
      payload.descriptionEmailReportDateMonth = '55'
      payload.descriptionEmailReportDateYear = '202'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">The date entered must be a real date</a>')
    })
    it('Sad: should fail validation and return error message if date of email - day and year is invalid', async () => {
      payload.descriptionEmailReportDateDay = '55'
      payload.descriptionEmailReportDateMonth = '10'
      payload.descriptionEmailReportDateYear = '204'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">The date entered must be a real date</a>')
    })
    it('Sad: should fail validation and return error message if date of email - day, month and year values are invalid', async () => {
      payload.descriptionEmailReportDateDay = 'aa'
      payload.descriptionEmailReportDateMonth = 'bb'
      payload.descriptionEmailReportDateYear = 'cccc'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDate">The date entered must be a real date</a>')
    })
    it('Sad: should fail validation and return error message for missing time of email fields', async () => {
      payload.descriptionEmailReportTime = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportTime">Enter the time the email was received</a>')
    })
    it('Sad: should fail validation and return error message if time of email is invalid', async () => {
      payload.descriptionEmailReportTime = '75:95'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportTime">Enter a time using the 24-hour clock, from 00:00 for midnight, to 23:59</a>')
    })
    it('Happy: should pass validation and if data is entered into incident description text area', async () => {
      payload.descriptionDescription = 'Test data'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<textarea class="govuk-textarea" id="descriptionDescription" name="descriptionDescription" rows="12">Test data</textarea>')
    })
  })
})
