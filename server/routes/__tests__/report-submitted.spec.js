import { submitGetRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'

const url = constants.routes.REPORT_SUBMITTED
const sessionData = {
  'create-a-report': {
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
  },
  'report-submitted': true
}

describe(url, () => {
  describe('GET', () => {
    it(`Should return Report submitted if session present and REPORT_SUBMITTED is true and correct view for ${url}`, async () => {
      const response = await submitGetRequest({ url }, 'Report submitted', 200, sessionData)
      expect(response.request.yar._store).toEqual({})
      expect(response.payload).toContain('Your report of Water pollution, including sewage has been added to NIRS.')
    })
    it(`Should redirect to CHECK_AND_SUBMIT_REPORT if report hasn't been submitted ${url}`, async () => {
      sessionData['report-submitted'] = false
      const response = await submitGetRequest({ url }, undefined, 302, sessionData)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
      expect(response.request.yar._store).toEqual(sessionData)
    })
  })
})
