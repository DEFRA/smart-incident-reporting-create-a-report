import { submitGetRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'

const url = '/accessibility'

describe('GET /accessibility', () => {
  it('returns 200 and contains accessibility heading', async () => {
    await submitGetRequest({ url }, 'Accessibility statement for the Report an environmental problem service', constants.statusCodes.OK)
  })
})
