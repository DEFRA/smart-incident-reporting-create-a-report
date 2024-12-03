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
  descriptionIncidentType: 'Water pollution',
  descriptionReportedByEmail: 'true',
  locationDescription: 'Location description',
  locationGridRef: 'SJ 67084 44110',
  reporterEmail: 'test@Test.com'
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
  })
})
