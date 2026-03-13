import { submitGetRequest, submitPostRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'

const url = constants.routes.CHECK_REPORTER_TYPE

const sessionData = {
  'create-a-report': {
    reporterEmail: 'user@thameswater.co.uk',
    reporterType: 'public',
    reporterWaterName: '',
    reporterOtherName: '',
    reporterRole: ''
  }
}

const getSessionData = () => JSON.parse(JSON.stringify(sessionData))

describe(url, () => {
  describe('GET', () => {
    it(`Should return success response and correct view for ${url}`, async () => {
      const response = await submitGetRequest({ url }, 'Check reporter type', 200, getSessionData())
      expect(response.payload).toContain('<strong>user@thameswater.co.uk</strong> looks like a water company email')
    })

    it('Should redirect to create-a-report when reporter email is missing in session', async () => {
      const response = await submitGetRequest({ url }, undefined, 302)
      expect(response.headers.location).toEqual(constants.routes.CREATE_A_REPORT)
    })

    it('Should preselect water company reporter type by default', async () => {
      const response = await submitGetRequest({ url }, 'Check reporter type', 200, getSessionData())
      expect(response.payload).toMatch(/id="water"[^>]*checked/)
    })
  })

  describe('POST', () => {
    it('Should redirect to create-a-report when reporter email is missing in session', async () => {
      const options = {
        url,
        payload: {
          reporterType: 'water',
          reporterWaterName: 'Thames Water Utilities Ltd'
        }
      }

      const response = await submitPostRequest(options, 302)
      expect(response.headers.location).toEqual(constants.routes.CREATE_A_REPORT)
    })

    it('Should return validation error when water reporter type is selected without water company', async () => {
      const options = {
        url,
        payload: {
          reporterType: 'water',
          reporterWaterName: ''
        }
      }

      const response = await submitPostRequest(options, 200, getSessionData())
      expect(response.payload).toContain('<a href="#reporterWaterName">Select a water company</a>')
    })

    it('Should return validation error when other reporter type is selected without organisation name', async () => {
      const options = {
        url,
        payload: {
          reporterType: 'other',
          reporterOtherName: ''
        }
      }

      const response = await submitPostRequest(options, 200, getSessionData())
      expect(response.payload).toContain('<a href="#reporterOtherName">Enter an organisation name</a>')
    })

    it('Should return validation error when organisation name is more than 50 characters', async () => {
      const options = {
        url,
        payload: {
          reporterType: 'other',
          reporterOtherName: 'a'.repeat(51)
        }
      }

      const response = await submitPostRequest(options, 200, getSessionData())
      expect(response.payload).toContain('<a href="#reporterOtherName">Organisation name must be 50 characters or less</a>')
    })

    it('Should redirect to check-and-submit-report and persist valid water selection', async () => {
      const options = {
        url,
        payload: {
          reporterType: 'water',
          reporterWaterName: 'Thames Water Utilities Ltd',
          reporterOtherName: 'Old other value',
          reporterRole: 'Old role value'
        }
      }

      const response = await submitPostRequest(options, 302, getSessionData())
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
      expect(response.request.yar.get(constants.redisKeys.CREATE_A_REPORT)).toEqual(expect.objectContaining({
        reporterType: 'water',
        reporterWaterName: 'Thames Water Utilities Ltd',
        reporterOtherName: '',
        reporterRole: ''
      }))
    })

    it('Should clear water company value when non-water reporter type is selected', async () => {
      const existingSessionData = getSessionData()
      existingSessionData['create-a-report'].reporterWaterName = 'Thames Water Utilities Ltd'

      const options = {
        url,
        payload: {
          reporterType: 'public'
        }
      }

      const response = await submitPostRequest(options, 302, existingSessionData)
      expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
      expect(response.request.yar.get(constants.redisKeys.CREATE_A_REPORT)).toEqual(expect.objectContaining({
        reporterType: 'public',
        reporterWaterName: '',
        reporterOtherName: '',
        reporterRole: ''
      }))
    })
  })
})
