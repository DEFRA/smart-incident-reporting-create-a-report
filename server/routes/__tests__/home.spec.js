import { submitGetRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'

const url = '/'

describe(url, () => {
  const mockGetSessionIdFromToken = jest.fn()
  jest.mock('../../utils/auth.js', () => ({
    getSessionIdFromToken: mockGetSessionIdFromToken
  }))

  describe('GET', () => {
    it(`Should return success response and correct view for ${url}`, async () => {
      mockGetSessionIdFromToken.mockReturnValueOnce('test-session-id-123')
      const response = await submitGetRequest({ url }, '', constants.statusCodes.REDIRECT)
      expect(response.headers.location).toEqual(constants.routes.CREATE_A_REPORT)
    })

    it(`Should set access and refresh tokens for ${url}`, async () => {
      const options = {
        url,
        auth: {
          strategy: 'azure-auth',
          credentials: {
            profile: {
              displayName: 'Smith, John'
            },
            token: 'mock-access-token-123',
            refreshToken: 'mock-refresh-token-123'
          }
        }
      }

      mockGetSessionIdFromToken.mockReturnValueOnce('test-session-id-123')
      const response = await submitGetRequest(options, '', constants.statusCodes.REDIRECT)
      expect(response.headers.location).toEqual(constants.routes.CREATE_A_REPORT)

      const cachedTokenData = await response.request.server.app.tokenCache.get('test-session-id-123')
      expect(cachedTokenData).toEqual({
        profile: {
          displayName: 'Smith, John'
        },
        token: 'mock-access-token-123',
        refreshToken: 'mock-refresh-token-123'
      })
    })
  })
})
