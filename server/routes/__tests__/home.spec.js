import { submitGetRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'
// import wreck from '@hapi/wreck'
// import config from '../../utils/config.js'

// jest.mock('@hapi/wreck')

// import { getSessionIdFromToken } from '../utils/auth.js

const mockGetSessionIdFromToken = jest.fn()
jest.mock('../../utils/auth.js', () => ({
  getSessionIdFromToken: mockGetSessionIdFromToken
}))

const url = '/'

describe(url, () => {
  // beforeEach(() => {
  //   // Mock the Graph API call to return empty groups by default
  //   wreck.post = jest.fn().mockResolvedValue({
  //     payload: { value: [] }
  //   })
  // })

  // afterEach(() => {
  //   jest.clearAllMocks()
  // })

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

    // it('Should handle Graph API error gracefully', async () => {
    //   wreck.post.mockRejectedValue(new Error('Graph API unavailable'))

    //   const response = await submitGetRequest({ url }, undefined, 502)
    //   // The error-pages plugin intercepts Boom errors and returns the 500 error view
    //   expect(response.payload).toContain('Sorry, there is a problem with the service')
    // })

    // it('Should store group membership as true when user is in the target group', async () => {
    //   const mockGroupId = 'test-group-id-123'
    //   const originalRmGroupId = config.rmGroupId
    //   config.rmGroupId = mockGroupId

    //   wreck.post.mockResolvedValue({
    //     payload: {
    //       value: [mockGroupId]
    //     }
    //   })

    //   const response = await submitGetRequest({ url }, '', constants.statusCodes.REDIRECT)
    //   expect(response.headers.location).toEqual(constants.views.CREATE_A_REPORT)
    //   expect(response.request.yar.get(constants.redisKeys.GROUP_MEMBER)).toBe(true)

    //   config.rmGroupId = originalRmGroupId
    // })

    // it('Should store group membership as false when user is not in the target group', async () => {
    //   const mockGroupId = 'test-group-id-123'
    //   const originalRmGroupId = config.rmGroupId
    //   config.rmGroupId = mockGroupId

    //   wreck.post.mockResolvedValue({
    //     payload: {
    //       value: []
    //     }
    //   })

    //   const response = await submitGetRequest({ url }, '', constants.statusCodes.REDIRECT)
    //   expect(response.headers.location).toEqual(constants.views.CREATE_A_REPORT)
    //   expect(response.request.yar.get(constants.redisKeys.GROUP_MEMBER)).toBe(false)

    //   config.rmGroupId = originalRmGroupId
    // })

    // it('Should store group membership as false when Graph API returns no groups', async () => {
    //   wreck.post.mockResolvedValue({
    //     payload: { value: [] }
    //   })

    //   const response = await submitGetRequest({ url }, '', constants.statusCodes.REDIRECT)
    //   expect(response.request.yar.get(constants.redisKeys.GROUP_MEMBER)).toBe(false)
    // })

    // it('Should handle missing Graph API response payload gracefully', async () => {
    //   wreck.post.mockResolvedValue({
    //     payload: null
    //   })

    //   const response = await submitGetRequest({ url }, '', constants.statusCodes.REDIRECT)
    //   expect(response.headers.location).toEqual(constants.views.CREATE_A_REPORT)
    //   expect(response.request.yar.get(constants.redisKeys.GROUP_MEMBER)).toBe(false)
    // })
  })
})
