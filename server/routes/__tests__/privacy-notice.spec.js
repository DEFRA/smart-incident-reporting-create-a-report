import { submitGetRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'

const url = '/privacy-notice'

describe('GET /privacy-notice', () => {
  it('returns 200 and contains privacy notice heading', async () => {
    await submitGetRequest({ url }, 'Privacy notice: Report an environmental problem service', constants.statusCodes.OK)
  })
})
