import { submitGetRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'

const url = constants.routes.SIGNOUT

describe(url, () => {
  describe('GET', () => {
    it(`Should return success response and correct view for ${url}`, async () => {
      const response = await submitGetRequest({ url }, '', constants.statusCodes.REDIRECT)
      expect(response.headers.location).toEqual('https://login.microsoftonline.com/test/oauth2/v2.0/logout')
    })
  })
})
