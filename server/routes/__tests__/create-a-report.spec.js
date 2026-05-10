import { submitGetRequest, submitPostRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'
import moment from 'moment'
import util from '../../utils/util.js'

jest.mock('../../../server/utils/util', () => ({
  getJson: jest.fn()
}))

const url = constants.routes.CREATE_A_REPORT

const mockPayload = {
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
  locationGridRef: 'SP 23916 82277',
  locationDescription: '',
  locationOfIncident: 'gridReference',
  reporterHomeAddress: '',
  dateObserved: 'now',
  dateTimeToday: '',
  dateTimeYesterday: '',
  dateOtherDay: '',
  dateOtherMonth: '',
  dateOtherYear: '',
  dateOtherTime: '',
  addressChosen: false,
  reporterPhotos: 'No'
}

const getPayload = () => ({ ...mockPayload })

describe(url, () => {
  describe('GET', () => {
    it(`Should return success response and correct view for ${url}`, async () => {
      const response = await submitGetRequest({ url })
      // Test for correct auth mock
      expect(response.payload).toContain('<p style="color: white; margin-top: 20px;">Smith, John  <a href="/signout" class="govuk-link govuk-link--inverse govuk-!-margin-top-1">Sign out</a></p>')
    })

    it('Should show errors from session data if fails validation for address', async () => {
      const sessionData = {
        'create-a-report': {
          locationOfIncident: 'address',
          buildingDetails: '10',
          postcodeDetails: 'abc'
        },
        'selected-address': 'test123'
      }

      const response = await submitGetRequest({ url }, null, 200, sessionData)
      expect(response.payload).toContain('There is a problem')
    })

    it('Should show errors from session data if fails validation for grid ref', async () => {
      const sessionData = {
        'create-a-report': {
          locationOfIncident: 'gridReference',
          locationDescription: ''
        }
      }

      const response = await submitGetRequest({ url }, null, 200, sessionData)
      expect(response.payload).toContain('There is a problem')
    })

    it('Should add post recovery payload to session and prepopulate fields', async () => {
      const payloadRecoveryData = {
        path: constants.routes.CHECK_AND_SUBMIT_REPORT,
        payload: {
          locationOfIncident: 'gridReference',
          locationGridRef: 'tt1234567890'
        }
      }

      const sessionData = {}
      sessionData[constants.redisKeys.POST_DATA_RECOVERY] = payloadRecoveryData

      const response = await submitGetRequest({ url }, null, 200, sessionData)
      expect(response.payload).toContain('tt1234567890')
    })
  })

  describe('POST', () => {
    it('Happy: should redirect to CHECK_AND_SUBMIT_REPORT if valid session', async () => {
      const sessionData = {
        'selected-address': 'test123'
      }

      const payload = getPayload()
      payload.locationOfIncident = 'address'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
    })

    it('Happy: should redirect to CHECK_AND_SUBMIT_REPORT when reporter email is empty', async () => {
      const payload = getPayload()
      payload.reporterEmail = ''
      payload.reporterType = 'public'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 302)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
    })

    it('Happy: should redirect to CHECK_AND_SUBMIT_REPORT when reporter type is water with email', async () => {
      const payload = getPayload()
      payload.reporterType = 'water'
      payload.reporterEmail = 'someone@example.com'
      payload.reporterWaterName = 'Thames Water Utilities Ltd'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 302)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
    })

    it('Happy: should redirect to CHECK_AND_SUBMIT_REPORT when reporter type is public and email is not a water company domain', async () => {
      const payload = getPayload()
      payload.reporterType = 'public'
      payload.reporterEmail = 'someone@example.com'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 302)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
    })

    it('Happy: should redirect to CHECK_AND_SUBMIT_REPORT when reporter type is other and email is not a water company domain', async () => {
      const payload = getPayload()
      payload.reporterType = 'other'
      payload.reporterEmail = 'someone@example.com'
      payload.reporterOtherName = 'Environment Agency'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 302)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
    })

    it('Happy: should redirect to CHECK_REPORTER_TYPE when reporter type is public with water company email domain', async () => {
      const payload = getPayload()
      payload.reporterType = 'public'
      payload.reporterEmail = 'someone@thameswater.co.uk'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 302)
      expect(response.headers.location).toEqual(constants.routes.CHECK_REPORTER_TYPE)
    })

    it('Happy: should redirect to CHECK_REPORTER_TYPE when reporter type is other with water company email domain', async () => {
      const payload = getPayload()
      payload.reporterType = 'other'
      payload.reporterEmail = 'someone@thameswater.co.uk'
      payload.reporterOtherName = 'Environment Agency'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 302)
      expect(response.headers.location).toEqual(constants.routes.CHECK_REPORTER_TYPE)
    })

    // Test for Incident description tab
    it('Sad: should fail validation and return error message for missing location details', async () => {
      const payload = getPayload()
      payload.locationOfIncident = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('Select how you want to give a location')
    })

    it('Sad: should fail validation and return error message for missing incident description', async () => {
      const payload = getPayload()
      payload.descriptionDescription = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionDescription">Enter an incident description</a>')
    })

    it('Sad: should fail validation and return error message for incident description exceeds the maximum of 1500 characters', async () => {
      const payload = getPayload()
      const testString = 'test '.repeat(320).trim()
      payload.descriptionDescription = testString
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionDescription">Incident description must be 1500 characters or less</a>')
    })

    it('Sad: should fail validation and return error message for missing incident type', async () => {
      const payload = getPayload()
      payload.descriptionIncidentType = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionIncidentType">Select an incident type</a>')
    })

    it('Sad: should fail validation and return error message for missing date of email fields', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = ''
      payload.descriptionEmailReportDateMonth = ''
      payload.descriptionEmailReportDateYear = ''
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateDay">Enter the date the email was received</a>')
    })

    it('Sad: should fail validation and return error message for missing date of email fields', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = ''
      payload.descriptionEmailReportDateMonth = ''
      payload.descriptionEmailReportDateYear = ''
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateDay">Enter the date the email was received</a>')
    })

    it('Sad: should fail validation and return error message for missing date of email - day field', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = ''
      payload.descriptionEmailReportDateMonth = '05'
      payload.descriptionEmailReportDateYear = '2024'
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateDay">Enter the day the email was received</a>')
    })

    it('Sad: should fail validation and return error message for missing date of email - month field', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = '10'
      payload.descriptionEmailReportDateMonth = ''
      payload.descriptionEmailReportDateYear = '2024'
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateMonth">Enter the month the email was received</a>')
    })

    it('Sad: should fail validation and return error message for missing date of email - year field', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = '10'
      payload.descriptionEmailReportDateMonth = '05'
      payload.descriptionEmailReportDateYear = ''
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateYear">Enter the year the email was received</a>')
    })

    it('Sad: should fail validation and return error message for missing date of email - month and year fields', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = '01'
      payload.descriptionEmailReportDateMonth = ''
      payload.descriptionEmailReportDateYear = ''
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateMonth">Enter the month and year the email was received</a>')
    })

    it('Sad: should fail validation and return error message for missing date of email - day and year fields', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = ''
      payload.descriptionEmailReportDateMonth = '05'
      payload.descriptionEmailReportDateYear = ''
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateDay">Enter the day and year the email was received</a>')
    })

    it('Sad: should fail validation and return error message for missing date of email - day and month fields', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = ''
      payload.descriptionEmailReportDateMonth = ''
      payload.descriptionEmailReportDateYear = '2024'
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateDay">Enter the day and month the email was received</a>')
    })

    it('Sad: should fail validation and return error message if date of email is not in the past', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = '10'
      payload.descriptionEmailReportDateMonth = '05'
      payload.descriptionEmailReportDateYear = '2026'
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateDay">Date must be in the past</a>')
    })

    it('Sad: should fail validation and return error message if date of email - day is invalid', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = '55'
      payload.descriptionEmailReportDateMonth = '05'
      payload.descriptionEmailReportDateYear = '2024'
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateDay">Enter a day from 1 to 31</a>')
    })

    it('Sad: should fail validation and return error message if date of email - month is invalid', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = '05'
      payload.descriptionEmailReportDateMonth = '55'
      payload.descriptionEmailReportDateYear = '2024'
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateMonth">Enter a month using numbers 1 to 12</a>')
    })

    it('Sad: should fail validation and return error message if date of email - year is invalid', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = '05'
      payload.descriptionEmailReportDateMonth = '10'
      payload.descriptionEmailReportDateYear = '202'
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateYear">Enter a full year, for example 2024</a>')
    })

    it('Sad: should fail validation and return error message if date of email - day and month is invalid', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = '35'
      payload.descriptionEmailReportDateMonth = '55'
      payload.descriptionEmailReportDateYear = '2024'
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateDay">The date entered must be a real date</a>')
    })

    it('Sad: should fail validation and return error message if date of email - month and year is invalid', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = '15'
      payload.descriptionEmailReportDateMonth = '55'
      payload.descriptionEmailReportDateYear = '202'
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateDay">The date entered must be a real date</a>')
    })

    it('Sad: should fail validation and return error message if date of email - day and year is invalid', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = '55'
      payload.descriptionEmailReportDateMonth = '10'
      payload.descriptionEmailReportDateYear = '204'
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateDay">The date entered must be a real date</a>')
    })

    it('Sad: should fail validation and return error message if date of email - day, month and year values are invalid', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportDateDay = 'aa'
      payload.descriptionEmailReportDateMonth = 'bb'
      payload.descriptionEmailReportDateYear = 'cccc'
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportDateDay">The date entered must be a real date</a>')
    })

    it('Sad: should fail validation and return error message for missing time of email fields', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportTime = ''
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportTime">Enter the time the email was received</a>')
    })

    it('Sad: should fail validation and return error message if time of email is invalid', async () => {
      const payload = getPayload()
      payload.descriptionEmailReportTime = '75:95'
      payload.descriptionReportedByEmail = 'true'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#descriptionEmailReportTime">Enter a time using the 24-hour clock, from 00:00 for midnight, to 23:59</a>')
    })

    // Other date validation
    it('Sad: should fail validation and return error message if date of incident not selected on date tab', async () => {
      const payload = getPayload()
      payload.dateObserved = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateObserved">Select a date</a>')
    })

    it('Sad: should fail validation and return error message if dateobserved is today on date tab but no time', async () => {
      const payload = getPayload()
      payload.dateObserved = 'today'
      payload.dateTimeToday = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateTimeToday">Enter a time</a>')
    })

    it('Sad: should fail validation and return error message if dateobserved is yesterday on date tab but no time', async () => {
      const payload = getPayload()
      payload.dateObserved = 'yesterday'
      payload.dateTimeYesterday = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateTimeYesterday">Enter a time</a>')
    })

    // Test for Reporter tab
    it('Sad: should fail validation and return error message if yes is selected for Has photos or videos of problem with an empty email field', async () => {
      const payload = getPayload()
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
      const payload = getPayload()
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
      const payload = getPayload()
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
      const payload = getPayload()
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
      const payload = getPayload()
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
      const payload = getPayload()
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
      const payload = getPayload()
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
      const payload = getPayload()
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
      const payload = getPayload()
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
      const payload = getPayload()
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
      const payload = getPayload()
      payload.reporterPhone = 'test'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterPhone">Enter a phone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192</a>')
    })

    it('Sad: should fail validation and return error message if the reporters reference the maximum of 50 characters', async () => {
      const payload = getPayload()
      payload.reporterReference = 'pneumonoultramicroscopicsilicovolcanoconiosispseudopseudohypoparathyroidism'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterReference">Reporter&#39;s reference must be 50 characters or less</a>')
    })

    it('Sad: should fail validation and return error message if type of reporter is not selected ', async () => {
      const payload = getPayload()
      payload.reporterType = ''
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterType">Select the type of reporter</a>')
    })

    it('Sad: should fail validation and return error message if water company name is not selected ', async () => {
      const payload = getPayload()
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
      const payload = getPayload()
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
      const payload = getPayload()
      payload.reporterFirstName = 'pneumonoultramicroscopicsilic'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterFirstName">First name must be 20 characters or less</a>')
    })

    it('Sad: should fail validation and return error message if length of the reporter last name exceeds the maximum of 40 characters', async () => {
      const payload = getPayload()
      payload.reporterLastName = 'pneumonoultramicroscopicsilicovolcanoconiosispseudopseudohypoparathyroidism'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterLastName">Last name must be 40 characters or less</a>')
    })

    it('Sad: should fail validation and return error message if length of the organisation name exceeds the maximum of 50 characters', async () => {
      const payload = getPayload()
      payload.reporterType = 'other'
      payload.reporterOtherName = 'pneumonoultramicroscopicsilicovolcanoconiosispseudopseudohypoparathyroidism'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterOtherName">Organisation name must be 50 characters or less</a>')
    })

    it('Sad: should fail validation and return error message if length of the Reporter role or job title exceeds the maximum of 60 characters', async () => {
      const payload = getPayload()
      payload.reporterType = 'other'
      payload.reporterRole = 'pneumonoultramicroscopicsilicovolcanoconiosispseudopseudohypoparathyroidism'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#reporterRole">Reporter role or job title must be 60 characters or less</a>')
    })

    // Test for Location of incident tab
    it('Sad: should fail validation and return error message for missing grid reference', async () => {
      const payload = getPayload()
      payload.locationGridRef = 'sdfdsgfdgdf'
      payload.locationOfIncident = 'gridReference'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#locationGridRef">Enter a full, 12-character national grid reference, like SP 23916 82277</a>')
    })

    it('Sad: should fail validation and return error message for location description exceeds the maximum of 150 characters', async () => {
      const payload = getPayload()
      const testString = 'test '.repeat(32).trim()
      payload.locationDescription = testString
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#locationDescription">Location description must be 150 characters or less</a>')
    })

    it('Happy: should look up address given', async () => {
      util.getJson.mockResolvedValue({
        header: {
          totalresults: 2
        },
        results: [
          {
            DPA: {
              UPRN: '8',
              ADDRESS: '100, OAK AVENUE, ABERDEEN, AB12 3DE',
              POSTCODE: 'AB12 3DE',
              X_COORDINATE: 3,
              Y_COORDINATE: 8
            }
          },
          {
            DPA: {
              UPRN: '9',
              ADDRESS: '102, OAK AVENUE, ABERDEEN, AB12 3DE',
              POSTCODE: 'AB12 3DE',
              X_COORDINATE: 3,
              Y_COORDINATE: 8
            }
          }
        ]
      })

      const payload = getPayload()
      payload.locationOfIncident = 'address'
      payload.action = 'find-address'
      payload.buildingDetails = '98'
      payload.postcodeDetails = 'AB123DE'
      const options = {
        url,
        payload
      }

      await submitPostRequest(options, 200)
    })

    it('Happy: should show postcode-only search content when building details are empty', async () => {
      util.getJson.mockResolvedValue({
        header: {
          totalresults: 2
        },
        results: [
          {
            DPA: {
              UPRN: '8',
              ADDRESS: '100, OAK AVENUE, ABERDEEN, AB12 3DE',
              POSTCODE: 'AB12 3DE',
              X_COORDINATE: 3,
              Y_COORDINATE: 8
            }
          },
          {
            DPA: {
              UPRN: '9',
              ADDRESS: '102, OAK AVENUE, ABERDEEN, AB12 3DE',
              POSTCODE: 'AB12 3DE',
              X_COORDINATE: 3,
              Y_COORDINATE: 8
            }
          }
        ]
      })

      const payload = getPayload()
      payload.locationOfIncident = 'address'
      payload.action = 'find-address'
      payload.buildingDetails = ''
      payload.postcodeDetails = 'AB123DE'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('2 addresses found for <strong>AB123DE</strong>.')
      expect(response.payload).not.toContain('</strong> and <strong>AB123DE</strong>')
    })

    it('Happy: should select chosen address', async () => {
      const sessionData = {
        'choose-address': {
          resultsData: [
            {
              uprn: '1',
              postcodeDetails: 'SG14 3LB',
              address: '9, Watermill Lane, Hertford, SG14 3LB',
              x: 100001,
              y: 100001
            },
            {
              uprn: '2',
              postcodeDetails: 'SG14 3LB',
              address: '10, Watermill Lane, Hertford, SG14 3LB',
              x: 100002,
              y: 100002
            }
          ]
        }
      }

      const payload = getPayload()
      payload.locationOfIncident = 'address'
      payload.action = 'select-address'
      payload.addressId = '2'
      const options = {
        url,
        payload
      }

      await submitPostRequest(options, 200, sessionData)
    })

    it('Happy: should show address selection on change address button with saved address data', async () => {
      const sessionData = {
        'building-data': { buildingDetails: '10', postcodeDetails: 'SG143LB' }
      }

      const payload = getPayload()
      payload.locationOfIncident = 'address'
      payload.action = 'change-address'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200, sessionData)
      expect(response.payload).toContain('type="radio" value="address" checked')
      expect(response.payload).toContain('id="buildingDetails" name="buildingDetails" type="text" value="10"')
      expect(response.payload).toContain('id="postcodeDetails" name="postcodeDetails" type="text" value="SG143LB"')
    })

    it('Happy: should show address selection on different address button without saved address data', async () => {
      const sessionData = {
        'building-data': { buildingDetails: '10', postcodeDetails: 'SG143LB' }
      }

      const payload = getPayload()
      payload.locationOfIncident = 'address'
      payload.action = 'different-address'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200, sessionData)
      expect(response.payload).toContain('type="radio" value="address" checked')
      expect(response.payload).toContain('class="govuk-input govuk-!-width-one-half" id="buildingDetails" name="buildingDetails" type="text" aria-describedby="buildingDetails-hint">')
      expect(response.payload).toContain('class="govuk-input govuk-input--width-10" id="postcodeDetails" name="postcodeDetails" type="text" autocomplete="postal-code">')
    })

    it('Happy: should show grid ref radio on use grid ref button but keep saved address data', async () => {
      const sessionData = {
        'building-data': { buildingDetails: '10', postcodeDetails: 'SG143LB' }
      }

      const payload = getPayload()
      payload.locationOfIncident = 'address'
      payload.action = 'use-grid-reference'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200, sessionData)
      expect(response.payload).toContain('type="radio" value="gridReference" checked')
      expect(response.payload).toContain('id="buildingDetails" name="buildingDetails" type="text" value="10"')
      expect(response.payload).toContain('id="postcodeDetails" name="postcodeDetails" type="text" value="SG143LB"')
    })

    it('Sad: should fail validation and return error message for missing postcode', async () => {
      const payload = getPayload()
      payload.locationOfIncident = 'address'
      payload.action = 'find-address'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).not.toContain('Enter a building number or name')
      expect(response.payload).toContain('Enter a postcode')
    })

    it('Sad: should error if no address selected on select chosen address button', async () => {
      const payload = getPayload()
      payload.locationOfIncident = 'address'
      payload.action = 'select-address'
      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('Select an address')
    })

    // Test for Date of incident tab
    it('Sad: should fail validation if dateobserved is before on date tab but no day', async () => {
      const payload = getPayload()
      payload.dateObserved = 'before'
      payload.dateTimeToday = ''
      payload.dateTimeYesterday = ''
      payload.dateOtherDay = ''
      payload.dateOtherMonth = '12'
      payload.dateOtherYear = '2024'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOtherDay">Enter a day</a>')
    })

    it('Sad: should fail validation if dateobserved is before on date tab but no year', async () => {
      const payload = getPayload()
      payload.dateObserved = 'before'
      payload.dateTimeToday = ''
      payload.dateTimeYesterday = ''
      payload.dateOtherDay = '10'
      payload.dateOtherMonth = '12'
      payload.dateOtherYear = ''
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOtherYear">Enter a year</a>')
    })

    it('Sad: should fail validation if dateobserved is before on date tab but no month', async () => {
      const payload = getPayload()
      payload.dateObserved = 'before'
      payload.dateTimeToday = ''
      payload.dateTimeYesterday = ''
      payload.dateOtherDay = '10'
      payload.dateOtherMonth = ''
      payload.dateOtherYear = '2024'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOtherMonth">Enter a month</a>')
    })

    it('Sad: should fail validation if dateobserved is before on date tab but bad day', async () => {
      const payload = getPayload()
      payload.dateObserved = 'before'
      payload.dateTimeToday = ''
      payload.dateTimeYesterday = ''
      payload.dateOtherDay = '40'
      payload.dateOtherMonth = '12'
      payload.dateOtherYear = '2024'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOtherDay">Enter a day from 1 to 31</a>')
    })

    it('Sad: should fail validation if dateobserved is before on date tab but bad month', async () => {
      const payload = getPayload()
      payload.dateObserved = 'before'
      payload.dateTimeToday = ''
      payload.dateTimeYesterday = ''
      payload.dateOtherDay = '10'
      payload.dateOtherMonth = '15'
      payload.dateOtherYear = '2024'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOtherMonth">Enter a month using numbers 1 to 12</a>')
    })

    it('Sad: should fail validation if dateobserved is before on date tab but bad year', async () => {
      const payload = getPayload()
      payload.dateObserved = 'before'
      payload.dateTimeToday = ''
      payload.dateTimeYesterday = ''
      payload.dateOtherDay = '10'
      payload.dateOtherMonth = '12'
      payload.dateOtherYear = 'sdf'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOtherYear">Enter a full year, for example 2024</a>')
    })

    it('Sad: should fail validation if dateobserved is before on date tab but bad date', async () => {
      const payload = getPayload()
      payload.dateObserved = 'before'
      payload.dateTimeToday = ''
      payload.dateTimeYesterday = ''
      payload.dateOtherDay = '31'
      payload.dateOtherMonth = '04'
      payload.dateOtherYear = '2024'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOtherDay">The date entered must be a real date</a>')
    })

    it('Sad: should fail validation if dateobserved is before but date is in future', async () => {
      const payload = getPayload()
      payload.dateObserved = 'before'
      payload.dateTimeToday = ''
      payload.dateTimeYesterday = ''
      payload.dateOtherDay = '10'
      payload.dateOtherMonth = '04'
      payload.dateOtherYear = '2030'
      payload.dateOtherTime = '09:00'

      const options = {
        url,
        payload
      }

      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateOtherDay">Date must be in the past</a>')
    })

    it('Sad: should fail validation if 2 date parts missing', async () => {
      const payload = getPayload()
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
      expect(response.payload).toContain('<a href="#dateOtherDay">Enter a day and month</a>')
    })

    it('Sad: should fail validation if 2 date parts missing', async () => {
      const payload = getPayload()
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
      expect(response.payload).toContain('<a href="#dateOtherMonth">Enter a month and year</a>')
    })

    it('Sad: should fail validation if 2 date parts missing', async () => {
      const payload = getPayload()
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
      expect(response.payload).toContain('<a href="#dateOtherDay">Enter a day and year</a>')
    })

    it('Sad: should fail validation if dateobserved is before date/time reported by email', async () => {
      const payload = getPayload()
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
      const payload = getPayload()
      payload.descriptionReportedByEmail = 'true'
      payload.descriptionEmailReportDateDay = '10'
      payload.descriptionEmailReportDateMonth = '05'
      payload.descriptionEmailReportDateYear = '2025'
      payload.descriptionEmailReportTime = '08:00'
      payload.descriptionReportedByEmail = 'true'
      payload.dateObserved = 'now'
      payload.dateTimeToday = ''
      payload.dateTimeYesterday = ''
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

    it('Sad: should fail validation and return error message if dateObserved is today and time is exactly current time + 5 minutes', async () => {
      const payload = getPayload()
      payload.dateObserved = 'today'
      const nowPlusFive = moment().add(5, 'minutes').format('HH:mm')
      payload.dateTimeToday = nowPlusFive

      const options = {
        url,
        payload
      }
      const response = await submitPostRequest(options, 200)
      expect(response.payload).toContain('<a href="#dateTimeToday">Time must be in the past</a>')
    })

    it('Happy: accepts valid answer now and current time is stored', async () => {
      const payload = getPayload()
      const options = {
        url,
        payload
      }

      const currentTime = moment().format('HH:mm')
      const expectedPayload = {
        ...payload,
        nowTime: currentTime
      }

      const response = await submitPostRequest(options)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
      expect(response.request.yar.get(constants.redisKeys.CREATE_A_REPORT)).toEqual(expectedPayload)
    })

    it('Happy: accepts valid answer today for email report', async () => {
      const date = new Date()
      const day = date.getDate().toString()
      const month = (date.getMonth() + 1).toString()
      const year = date.getFullYear().toString()

      const payload = getPayload()
      payload.descriptionReportedByEmail = 'true'
      payload.descriptionEmailReportDateDay = day
      payload.descriptionEmailReportDateMonth = month
      payload.descriptionEmailReportDateYear = year
      payload.descriptionEmailReportTime = '00:02'
      payload.dateOtherDay = day
      payload.dateOtherMonth = month
      payload.dateOtherYear = year
      payload.dateObserved = 'today'
      payload.dateTimeToday = '00:01'
      const options = {
        url,
        payload
      }

      const expectedPayload = {
        ...payload
      }

      const response = await submitPostRequest(options)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
      expect(response.request.yar.get(constants.redisKeys.CREATE_A_REPORT)).toEqual(expectedPayload)
    })

    it('Happy: accepts valid answer yesterday', async () => {
      const date = new Date()
      const day = date.getDate().toString()
      const month = (date.getMonth() + 1).toString()
      const year = date.getFullYear().toString()
      date.setDate(date.getDate() - 1)
      const dayYest = date.getDate().toString()
      const monthYest = (date.getMonth() + 1).toString()
      const yearYest = date.getFullYear().toString()

      const payload = getPayload()
      payload.descriptionReportedByEmail = 'true'
      payload.descriptionEmailReportDateDay = day
      payload.descriptionEmailReportDateMonth = month
      payload.descriptionEmailReportDateYear = year
      payload.descriptionEmailReportTime = '00:02'
      payload.dateOtherDay = dayYest
      payload.dateOtherMonth = monthYest
      payload.dateOtherYear = yearYest
      payload.dateObserved = 'yesterday'
      payload.dateTimeYesterday = '10:00'
      const options = {
        url,
        payload
      }

      const expectedPayload = {
        ...payload,
        dateTimeYesterday: '10:00'
      }

      const response = await submitPostRequest(options)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
      expect(response.request.yar.get(constants.redisKeys.CREATE_A_REPORT)).toEqual(expectedPayload)
    })
    it('Happy: accepts and stores unchecked value of reporterHomeAddress as empty if gridReference is selected', async () => {
      const payload = getPayload()
      const options = {
        url,
        payload
      }

      const currentTime = moment().format('HH:mm')
      const expectedPayload = {
        ...payload,
        nowTime: currentTime,
        reporterHomeAddress: ''
      }

      const response = await submitPostRequest(options)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
      expect(response.request.yar.get(constants.redisKeys.CREATE_A_REPORT)).toEqual(expectedPayload)
    })
    it('Happy: accepts and stores unchecked value of reporterHomeAddress as No if address is selected', async () => {
      const sessionData = {
        'selected-address': 'test123'
      }

      const payload = getPayload()
      payload.locationOfIncident = 'address'
      payload.addressChosen = true
      const options = {
        url,
        payload
      }

      const currentTime = moment().format('HH:mm')
      const expectedPayload = {
        ...payload,
        nowTime: currentTime,
        reporterHomeAddress: 'No'
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
      expect(response.request.yar.get(constants.redisKeys.CREATE_A_REPORT)).toEqual(expectedPayload)
    })
  })
})
