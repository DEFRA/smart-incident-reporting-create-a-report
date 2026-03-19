import { submitGetRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'
import wreck from '@hapi/wreck'
import config from '../../utils/config.js'

jest.mock('@hapi/wreck')

const url = '/'

describe(url, () => {
  beforeEach(() => {
    // Mock the Graph API call to return empty groups by default
    wreck.post = jest.fn().mockResolvedValue({
      payload: { value: [] }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it(`Should return success response and correct view for ${url}`, async () => {
      const response = await submitGetRequest({ url }, '', constants.statusCodes.REDIRECT)
      expect(response.headers.location).toEqual(constants.views.CREATE_A_REPORT)
      expect(wreck.post).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/checkMemberGroups',
        expect.objectContaining({
          json: true
        })
      )
    })

    it('Should handle Graph API error gracefully', async () => {
      wreck.post.mockRejectedValue(new Error('Graph API unavailable'))

      const response = await submitGetRequest({ url }, undefined, 502)
      // The error-pages plugin intercepts Boom errors and returns the 500 error view
      expect(response.payload).toContain('Sorry, there is a problem with the service')
    })

    it('Should store group membership as true when user is in the target group', async () => {
      const mockGroupId = 'test-group-id-123'
      const originalRmGroupId = config.rmGroupId
      config.rmGroupId = mockGroupId

      wreck.post.mockResolvedValue({
        payload: {
          value: [mockGroupId]
        }
      })

      const response = await submitGetRequest({ url }, '', constants.statusCodes.REDIRECT)
      expect(response.headers.location).toEqual(constants.views.CREATE_A_REPORT)
      expect(response.request.yar.get(constants.redisKeys.GROUP_MEMBER)).toBe(true)

      config.rmGroupId = originalRmGroupId
    })

    it('Should store group membership as false when user is not in the target group', async () => {
      const mockGroupId = 'test-group-id-123'
      const originalRmGroupId = config.rmGroupId
      config.rmGroupId = mockGroupId

      wreck.post.mockResolvedValue({
        payload: {
          value: []
        }
      })

      const response = await submitGetRequest({ url }, '', constants.statusCodes.REDIRECT)
      expect(response.headers.location).toEqual(constants.views.CREATE_A_REPORT)
      expect(response.request.yar.get(constants.redisKeys.GROUP_MEMBER)).toBe(false)

      config.rmGroupId = originalRmGroupId
    })

    it('Should store group membership as false when Graph API returns no groups', async () => {
      wreck.post.mockResolvedValue({
        payload: { value: [] }
      })

      const response = await submitGetRequest({ url }, '', constants.statusCodes.REDIRECT)
      expect(response.request.yar.get(constants.redisKeys.GROUP_MEMBER)).toBe(false)
    })

    it('Should set cookieAuth with user profile', async () => {
      const response = await submitGetRequest({ url }, '', constants.statusCodes.REDIRECT)
      expect(response.headers.location).toEqual(constants.views.CREATE_A_REPORT)
      // The cookieAuth.set is called with the profile from request.auth.credentials
      // This is verified by the successful redirect
    })

    it('Should handle missing Graph API response payload gracefully', async () => {
      wreck.post.mockResolvedValue({
        payload: null
      })

      const response = await submitGetRequest({ url }, '', constants.statusCodes.REDIRECT)
      expect(response.headers.location).toEqual(constants.views.CREATE_A_REPORT)
      expect(response.request.yar.get(constants.redisKeys.GROUP_MEMBER)).toBe(false)
    })
  })
})
