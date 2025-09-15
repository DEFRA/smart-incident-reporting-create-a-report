import { submitGetRequest, submitPostRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'
import moment from 'moment'
import util from '../../utils/util.js'

jest.mock('../../../server/utils/util', () => ({
  getJson: jest.fn()
}))

util.getJson.mockResolvedValue({
  header: {
    totalresults: 2
  },
  results: [
    {
      DPA: {
        UPRN: '9051088093',
        ADDRESS: '100, OAK AVENUE, ABERDEEN, AB12 3DE',
        POSTCODE: 'AB12 3DE',
        X_COORDINATE: 394548.0,
        Y_COORDINATE: 803010.0
      }
    },
    {
      DPA: {
        UPRN: '9051088094',
        ADDRESS: '102, OAK AVENUE, ABERDEEN, AB12 3DE',
        POSTCODE: 'AB12 3DE',
        X_COORDINATE: 394542.0,
        Y_COORDINATE: 803005.0
      }
    }
  ]
})

const url = constants.routes.CREATE_A_REPORT

const payload = {
  action: 'check-report',
  descriptionDescription: 'fewqfewfe',
  descriptionEmailReportDateDay: '',
  descriptionEmailReportDateMonth: '',
  descriptionEmailReportDateYear: '',
  descriptionEmailReportTime: '',
  descriptionIncidentType: '100',
  reporterFirstName: 'Bob',
  reporterLastName: 'Monkhouse',
  reporterEmail: '',
  reporterPhone: '',
  reporterReference: '',
  reporterType: 'public',
  reporterWaterName: '',
  reporterOtherName: '',
  reporterRole: '',
  locationGridRef: '',
  locationDescription: '',
  locationOfIncident: 'address',
  dateObserved: 'now',
  dateTime: '',
  dateOtherDay: '',
  dateOtherMonth: '',
  dateOtherYear: '',
  dateOtherTime: '',
  addressChosen: true,
  reporterPhotos: 'No',
  nowTime: '01:21'
}

// const payload = {
//   dateObserved: 'before',
//   dateOtherDay: '01',
//   dateOtherMonth: '12',
//   dateOtherTime: '09:00',
//   dateOtherYear: '2024',
//   dateTime: '',
//   descriptionDescription: 'Incident description',
//   descriptionEmailReportDateDay: '03',
//   descriptionEmailReportDateMonth: '12',
//   descriptionEmailReportDateYear: '2024',
//   descriptionEmailReportTime: '08:00',
//   descriptionIncidentType: '100',
//   descriptionReportedByEmail: 'true',
//   locationDescription: 'Location description',
//   locationGridRef: 'SJ 67084 44110',
//   locationOfIncident: 'address',
//   reporterEmail: 'test@Test.com',
//   reporterFirstName: 'John',
//   reporterLastName: 'Smith',
//   reporterPhone: '01234567890',
//   reporterType: 'water',
//   reporterReference: 'abc',
//   reporterRole: 'role',
//   reporterWaterName: 'Water Services Ltd',
//   reporterOtherName: '',
//   reporterPhotos: 'Yes',
//   buildingDetails: '1',
//   postcodeDetails: 'ab123de',
//   action: 'find-address'
// }

describe(url, () => {
  describe('GET', () => {
    it(`Should return success response and correct view for ${url}`, async () => {
      const response = await submitGetRequest({ url })
      // Test for correct auth mock
      expect(response.payload).toContain('<p style="color: white; margin-top: 20px;">Smith, John  <a href="/signout" class="govuk-link govuk-link--inverse govuk-!-margin-top-1">Sign out</a></p>')
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

    // Test for Incident description tab
    it('Sad: should fail validation and return error message for missing location details', async () => {
      payload.locationOfIncident = ''

      const options = {
        url,
        payload
      }
      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('Select the location of incident')
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

    it.only('Sad: should fail validation and return error message for missing incident type', async () => {
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
      expect(response.payload).toContain('<textarea class="govuk-textarea" id="descriptionDescription" name="descriptionDescription" rows="20">Test data</textarea>')
    })

    // Other date validation
    it('Sad: should fail validation and return error message if date of incident not selected on date tab', async () => {
      payload.dateObserved = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateObserved">Select a date</a>')
    })
    it('Sad: should fail validation and return error message if dateobserved is today on date tab but no time', async () => {
      payload.dateObserved = 'today'
      payload.dateTime = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateTime">Enter a time</a>')
    })
    it('Sad: should fail validation and return error message if dateobserved is yesterday on date tab but no time', async () => {
      payload.dateObserved = 'yesterday'
      payload.dateTime = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateTime">Enter a time</a>')
    })

    // Test for Reporter tab
    it('Sad: should fail validation and return error message if yes is selected for Has photos or videos of problem with an empty email field', async () => {
      payload.reporterPhotos = 'Yes'
      payload.reporterEmail = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterEmail">Enter an email address</a>')
    })
    it('Sad: should fail validation and return error message if yes is selected for Has photos or videos of problem with an invalid email', async () => {
      payload.reporterPhotos = 'Yes'
      payload.reporterEmail = 'testmail'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterEmail">Enter an email address in the correct format, like name@example.com</a>')
    })
    it('Sad: should fail validation and return error message if yes is selected for Has photos or videos of problem with an invalid email', async () => {
      payload.reporterPhotos = 'Yes'
      payload.reporterEmail = 'testmail@'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterEmail">Enter an email address in the correct format, like name@example.com</a>')
    })
    it('Sad: should fail validation and return error message if yes is selected for Has photos or videos of problem with an invalid email', async () => {
      payload.reporterPhotos = 'Yes'
      payload.reporterEmail = 'testmail@com'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterEmail">Enter an email address in the correct format, like name@example.com</a>')
    })
    it('Sad: should fail validation and return error message if no answer is selected for Has photos or videos of problem with an invalid email', async () => {
      payload.reporterPhotos = ''
      payload.reporterEmail = 'testmail'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterEmail">Enter an email address in the correct format, like name@example.com</a>')
    })
    it('Sad: should fail validation and return error message if no answer is selected for Has photos or videos of problem with an invalid email', async () => {
      payload.reporterPhotos = 'No'
      payload.reporterEmail = 'testmail'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterEmail">Enter an email address in the correct format, like name@example.com</a>')
    })
    it('Sad: should fail validation and return error message if length of the email length exceeds the maximum of 255 octets', async () => {
      payload.reporterPhotos = 'Yes'
      payload.reporterEmail = 'pneumonoultramicroscopicsilicovolcanoconiosispseudopseudohypoparathyroidismfloccinaucinihilipilificationpneumonoultramicroscopicsilicovolcanoconiosispseudopseudohypoparathyroidismfloccinaucinihilipilification'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterEmail">Enter an email address in the correct format, like name@example.com</a>')
    })
    it('Sad: should fail validation and return error message if the email account length exceeds the maximum of 64 octets', async () => {
      payload.reporterPhotos = 'Yes'
      payload.reporterEmail = 'pneumonoultramicroscopicsilicovolcanoconiosispseudopseudohypoparathyroidism@testmail.com'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterEmail">Enter an email address in the correct format, like name@example.com</a>')
    })
    it('Sad: should fail validation and return error message if the email address length exceeds the maximum of 255 octets', async () => {
      payload.reporterPhotos = 'Yes'
      payload.reporterEmail = 'testemail@pneumonoultramicroscopicsilicovolcanoconiosispseudopseudohypoparathyroidismfloccinaucinihilipilificationpneumonoultramicroscopicsilicovolcanoconiosispseudopseudohypoparathyroidismfloccinaucinihilipilification.com'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterEmail">Enter an email address in the correct format, like name@example.com</a>')
    })
    it('Sad: should fail validation and return error message if the email address has whitespaces', async () => {
      payload.reporterPhotos = 'Yes'
      payload.reporterEmail = 'this is test@testemail.co.uk'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterEmail">Enter an email address in the correct format, like name@example.com</a>')
    })
    it('Sad: should fail validation and return error message for invalid phone number', async () => {
      payload.reporterPhone = 'test'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterPhone">Enter a phone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192</a>')
    })
    it('Sad: should fail validation and return error message if type of reporter is not selected ', async () => {
      payload.reporterType = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterType">Select the type of reporter</a>')
    })
    it('Sad: should fail validation and return error message if water company name is not selected ', async () => {
      payload.reporterType = 'water'
      payload.reporterWaterName = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterWaterName">Select a water company</a>')
    })
    it('Sad: should fail validation and return error message if water company name is not selected ', async () => {
      payload.reporterType = 'other'
      payload.reporterOtherName = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterOtherName">Enter an organisation name</a>')
    })
    it('Sad: should fail validation and return error message if length of the reporter first name exceeds the maximum of 20 characters', async () => {
      payload.reporterFirstName = 'pneumonoultramicroscopicsilic'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterFirstName">First name must be 20 characters or less</a>')
    })
    it('Sad: should fail validation and return error message if length of the reporter last name exceeds the maximum of 40 characters', async () => {
      payload.reporterLastName = 'pneumonoultramicroscopicsilicovolcanoconiosispseudopseudohypoparathyroidism'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterLastName">Last name must be 40 characters or less</a>')
    })
    it('Sad: should fail validation and return error message if length of the organisation name exceeds the maximum of 50 characters', async () => {
      payload.reporterType = 'other'
      payload.reporterOtherName = 'pneumonoultramicroscopicsilicovolcanoconiosispseudopseudohypoparathyroidism'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterOtherName">Organisation name must be 50 characters or less</a>')
    })

    // Test for Location of incident tab
    it('Sad: should fail validation and return error message for missing grid reference', async () => {
      payload.locationGridRef = 'sdfdsgfdgdf'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#locationGridRef">Enter a full, 12-character national grid reference, like SP 23916 82277</a>')
    })
    // Test for Date of incident tab
    it('Sad: should fail validation if dateobserved is before on date tab but no day', async () => {
      payload.dateObserved = 'before'
      payload.dateTime = ''
      payload.dateOtherDay = ''
      payload.dateOtherMonth = '12'
      payload.dateOtherYear = '2024'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOther">Enter a day</a>')
    })
    it('Sad: should fail validation if dateobserved is before on date tab but no year', async () => {
      payload.dateObserved = 'before'
      payload.dateTime = ''
      payload.dateOtherDay = '10'
      payload.dateOtherMonth = '12'
      payload.dateOtherYear = ''
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOther">Enter a year</a>')
    })
    it('Sad: should fail validation if dateobserved is before on date tab but no month', async () => {
      payload.dateObserved = 'before'
      payload.dateTime = ''
      payload.dateOtherDay = '10'
      payload.dateOtherMonth = ''
      payload.dateOtherYear = '2024'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOther">Enter a month</a>')
    })
    it('Sad: should fail validation if dateobserved is before on date tab but bad day', async () => {
      payload.dateObserved = 'before'
      payload.dateTime = ''
      payload.dateOtherDay = '40'
      payload.dateOtherMonth = '12'
      payload.dateOtherYear = '2024'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOther">Enter a day from 1 to 31</a>')
    })
    it('Sad: should fail validation if dateobserved is before on date tab but bad month', async () => {
      payload.dateObserved = 'before'
      payload.dateTime = ''
      payload.dateOtherDay = '10'
      payload.dateOtherMonth = '15'
      payload.dateOtherYear = '2024'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOther">Enter a month using numbers 1 to 12</a>')
    })
    it('Sad: should fail validation if dateobserved is before on date tab but bad year', async () => {
      payload.dateObserved = 'before'
      payload.dateTime = ''
      payload.dateOtherDay = '10'
      payload.dateOtherMonth = '12'
      payload.dateOtherYear = 'sdf'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOther">Enter a full year, for example 2024</a>')
    })
    it('Sad: should fail validation if dateobserved is before on date tab but bad date', async () => {
      payload.dateObserved = 'before'
      payload.dateTime = ''
      payload.dateOtherDay = '31'
      payload.dateOtherMonth = '04'
      payload.dateOtherYear = '2024'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOther">The date entered must be a real date</a>')
    })
    it('Sad: should fail validation if dateobserved is before but date is in future', async () => {
      payload.dateObserved = 'before'
      payload.dateTime = ''
      payload.dateOtherDay = '10'
      payload.dateOtherMonth = '04'
      payload.dateOtherYear = '2030'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOther">Date must be in the past</a>')
    })
    it('Sad: should fail validation if 2 date parts missing', async () => {
      payload.dateObserved = 'before'
      payload.dateTime = '10:00'
      payload.dateOtherDay = ''
      payload.dateOtherMonth = ''
      payload.dateOtherYear = '2024'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOther">Enter a day and month</a>')
    })
    it('Sad: should fail validation if 2 date parts missing', async () => {
      payload.dateObserved = 'before'
      payload.dateTime = '10:00'
      payload.dateOtherDay = '10'
      payload.dateOtherMonth = ''
      payload.dateOtherYear = ''
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOther">Enter a month and year</a>')
    })
    it('Sad: should fail validation if 2 date parts missing', async () => {
      payload.dateObserved = 'before'
      payload.dateTime = '10:00'
      payload.dateOtherDay = ''
      payload.dateOtherMonth = '12'
      payload.dateOtherYear = ''
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOther">Enter a day and year</a>')
    })
    it('Sad: should fail validation if dateobserved is before date/time reported by email', async () => {
      payload.descriptionReportedByEmail = 'true'
      payload.descriptionEmailReportDateDay = '10'
      payload.descriptionEmailReportDateMonth = '05'
      payload.descriptionEmailReportDateYear = '2025'
      payload.descriptionEmailReportTime = '08:00'
      payload.descriptionReportedByEmail = 'true'
      payload.dateObserved = 'before'
      payload.dateTime = '10:00'
      payload.dateOtherDay = '10'
      payload.dateOtherMonth = '06'
      payload.dateOtherYear = '2025'
      payload.dateOtherTime = '09:30'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateObserved">The time of incident must be before 10 May 2025 08:00</a>')
    })
    it('Sad: should fail validation if dateobserved is now and before date/time reported by email', async () => {
      payload.descriptionReportedByEmail = 'true'
      payload.descriptionEmailReportDateDay = '10'
      payload.descriptionEmailReportDateMonth = '05'
      payload.descriptionEmailReportDateYear = '2025'
      payload.descriptionEmailReportTime = '08:00'
      payload.descriptionReportedByEmail = 'true'
      payload.dateObserved = 'now'
      payload.dateTime = ''
      payload.dateOtherDay = ''
      payload.dateOtherMonth = ''
      payload.dateOtherYear = ''
      payload.dateOtherTime = ''

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateObserved">The time of incident must be before 10 May 2025 08:00</a>')
    })
    it('Happy: accepts valid answer now and current time is stored', async () => {
      const currentTime = moment().format('HH:mm')
      const options = {
        url,
        payload: {
          dateObserved: 'now',
          dateOtherDay: '',
          dateOtherMonth: '',
          dateOtherTime: '',
          dateOtherYear: '',
          dateTime: '',
          descriptionDescription: 'Incident description',
          descriptionEmailReportDateDay: '',
          descriptionEmailReportDateMonth: '',
          descriptionEmailReportDateYear: '',
          descriptionEmailReportTime: '',
          descriptionIncidentType: '100',
          descriptionReportedByEmail: '',
          locationDescription: 'Location description',
          locationGridRef: 'SJ 67084 44110',
          reporterEmail: 'test@Test.com',
          reporterFirstName: 'John',
          reporterLastName: 'Smith',
          reporterPhone: '01234567890',
          reporterType: 'water',
          reporterWaterName: 'Water Services Ltd',
          reporterOtherName: '',
          reporterPhotos: 'Yes'
        }
      }
      const response = await submitPostRequest(options)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
      expect(response.request.yar.get(constants.redisKeys.CREATE_A_REPORT)).toEqual({
        dateObserved: 'now',
        dateOtherDay: '',
        dateOtherMonth: '',
        dateOtherTime: '',
        dateOtherYear: '',
        dateTime: '',
        descriptionDescription: 'Incident description',
        descriptionEmailReportDateDay: '',
        descriptionEmailReportDateMonth: '',
        descriptionEmailReportDateYear: '',
        descriptionEmailReportTime: '',
        descriptionIncidentType: '100',
        descriptionReportedByEmail: '',
        locationDescription: 'Location description',
        locationGridRef: 'SJ 67084 44110',
        reporterEmail: 'test@Test.com',
        reporterFirstName: 'John',
        reporterLastName: 'Smith',
        reporterPhone: '01234567890',
        reporterType: 'water',
        reporterWaterName: 'Water Services Ltd',
        reporterOtherName: '',
        reporterPhotos: 'Yes',
        nowTime: currentTime
      })
    })
  })
})
