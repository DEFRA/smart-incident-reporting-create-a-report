import { submitGetRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'
import config from '../../utils/config.js'

const url = constants.routes.SIGNOUT

describe(url, () => {
  describe('GET', () => {
    it(`Should return success response and correct view for ${url}`, async () => {
      const response = await submitGetRequest({ url }, '', constants.statusCodes.REDIRECT)
      expect(response.headers.location).toEqual(`https://login.microsoftonline.com/${config.aadTenant}/oauth2/v2.0/logout?post_logout_redirect_uri=${config.serviceUrl}/signed-out`)
    })
  })
})
