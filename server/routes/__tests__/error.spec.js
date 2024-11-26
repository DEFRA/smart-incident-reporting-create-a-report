import { submitGetRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'

const url = constants.routes.ERROR

describe(url, () => {
  describe('GET', () => {
    it(`Should return success response and correct view for ${url}`, async () => {
      await submitGetRequest({ url }, 'Sorry, there is a problem with the service', constants.statusCodes.PROBLEM_WITH_SERVICE)
    })
  })
})
