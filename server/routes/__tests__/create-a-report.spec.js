import { submitGetRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'

const url = constants.routes.CREATE_A_REPORT

describe(url, () => {
  describe('GET', () => {
    it(`Should return success response and correct view for ${url}`, async () => {
      const response = await submitGetRequest({ url })
      // Test for correct auth mock
      expect(response.payload).toContain('<p style="color: white;">Smith, John  <a href="/signout" class="govuk-link govuk-link--inverse govuk-!-margin-top-1">Sign out</a></p>')
    })
  })
})
