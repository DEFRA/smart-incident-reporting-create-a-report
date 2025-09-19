import { submitGetRequest, submitPostRequest } from '../../../__test-helpers__/server.js'
import constants from '../../../utils/constants.js'

const url = constants.routes.CREATE_REPORT_CANCEL
const sessionData = {
  'create-a-report': {
    descriptionDescription: 'test description'
  }
}

describe(url, () => {
  describe('GET', () => {
    it(`Should return success response and correct view for ${url}`, async () => {
      const response = await submitGetRequest({ url }, 'Cancel report', 200, sessionData)
      expect(response.request.yar.get('create-a-report')).toEqual(sessionData['create-a-report'])
    })
  })
  describe('POST', () => {
    it('Should clear out session cache on post', async () => {
      const options = {
        url
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.request.yar._store).toEqual({})
    })
  })
})
