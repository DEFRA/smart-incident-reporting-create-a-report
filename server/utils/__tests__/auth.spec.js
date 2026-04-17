import wreck from '@hapi/wreck'
import { getSessionIdFromToken, refreshTokens, isMemberOfRMGroup, validateToken } from '../auth.js'
import Jwt from '@hapi/jwt'

describe('auth', () => {
  describe('getSessionIdFromToken', () => {
    it('should return session ID from token', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiIxMjM0NTY3ODkwIn0.VDTaiy8L4CNELGEj66LDoW91WIR6BXT0v8ukenzb6ik'
      const sessionId = getSessionIdFromToken(mockToken)
      expect(sessionId).toEqual('1234567890')
    })

    it('should return error from malformed token', () => {
      const malformedToken = 'invalid.token.here'
      const sessionId = getSessionIdFromToken(malformedToken)
      expect(sessionId).toEqual(null)
    })
  })

  describe('refreshTokens', () => {
    jest.mock('@hapi/wreck')

    const mockWreckPost = jest.fn()
    const mockTokenPayload = {
      access_token: 'mock-access-token-123',
      refresh_token: 'mock-refresh-token-123'
    }
    const mockUserSession = {
      refreshToken: 'mock-refresh-token-123',
      profile: {
        email: 'mock-email@example.com'
      }
    }

    beforeEach(() => {
      wreck.post = mockWreckPost.mockResolvedValue({
        payload: mockTokenPayload
      })
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should refresh tokens successfully', async () => {
      const tokens = await refreshTokens(mockUserSession)
      expect(tokens).toEqual(mockTokenPayload)
      expect(mockWreckPost).toHaveBeenCalledWith(
        `https://login.microsoftonline.com/${process.env.AAD_TENANT}/oauth2/v2.0/token`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          payload: expect.stringContaining('grant_type=refresh_token'),
          json: true
        }
      )
    })

    it('should throw an error if the token refresh request fails', async () => {
      mockWreckPost.mockRejectedValue(new Error('Token refresh failed'))
      await expect(refreshTokens(mockUserSession)).rejects.toThrow()
    })
  })

  describe('isMemberOfRMGroup', () => {
    jest.mock('@hapi/wreck')

    const mockWreckPost = jest.fn()
    const mockGroupId = 'test-group-id-123'

    const mockRequest = {
      auth: {
        credentials: {
          sessionId: 'test-session-id-123',
          profile: {
            email: 'mock-email@example.com'
          }
        }
      },
      server: {
        app: {
          tokenCache: {
            get: () => ({
              token: 'mock-access-token-123'
            })
          }
        }
      }
    }

    beforeEach(() => {
      wreck.post = mockWreckPost
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return true if user is a member of RM group', async () => {
      mockWreckPost.mockResolvedValueOnce({
        payload: {
          value: [mockGroupId]
        }
      })

      const isMember = await isMemberOfRMGroup(mockRequest)
      expect(isMember).toBe(true)
      expect(mockWreckPost).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me/checkMemberGroups',
        {
          headers: {
            Authorization: 'Bearer mock-access-token-123',
            'Content-Type': 'application/json'
          },
          payload: JSON.stringify({ groupIds: [mockGroupId] }),
          json: true
        }
      )
    })

    it('should return false if user is not a member of RM group', async () => {
      mockWreckPost.mockResolvedValueOnce({
        payload: {
          value: []
        }
      })
      const isMember = await isMemberOfRMGroup(mockRequest)
      expect(isMember).toBe(false)
    })

    it('should return false if the Graph API request fails', async () => {
      const logSpy = jest.spyOn(global.console, 'error')
      mockWreckPost.mockRejectedValue(new Error('Error checking group membership'))
      const isMember = await isMemberOfRMGroup(mockRequest)
      expect(isMember).toBe(false)
      expect(logSpy).toHaveBeenCalled()
      expect(logSpy).toHaveBeenCalledWith('Error checking group membership for mock-email@example.com:', new Error('Error checking group membership'))
      logSpy.mockRestore()
    })
  })

  describe('validateToken', () => {
    jest.mock('@hapi/wreck')

    const jwtVerifyTimeSpy = jest.spyOn(Jwt.token, 'verifyTime')

    const mockWreckPost = jest.fn()
    const mockCacheGet = jest.fn()
    const mockCacheSet = jest.fn()
    const encodedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30'

    const mockTokenPayload = {
      access_token: 'mock-access-token-123',
      refresh_token: 'mock-refresh-token-123'
    }

    const mockSession = {
      sessionId: 'test-session-id-123'
    }

    const mockGoodUserSession = {
      profile: {
        email: 'mock-email@example.com'
      },
      token: encodedToken,
      refreshToken: 'mock-refresh-token-123'
    }

    const mockRequest = {
      auth: {
        credentials: {
          sessionId: 'test-session-id-123',
          profile: {
            email: 'mock-email@example.com'
          }
        }
      },
      server: {
        app: {
          tokenCache: {
            get: mockCacheGet,
            set: mockCacheSet
          }
        }
      }
    }

    beforeEach(() => {
      wreck.post = mockWreckPost
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return isValid true for valid session and tokens', async () => {
      mockCacheGet.mockResolvedValue(mockGoodUserSession)
      const result = await validateToken(mockRequest, mockSession)
      expect(result).toEqual({ isValid: true })
    })

    it('should refresh token and return isValid true for expired token', async () => {
      jwtVerifyTimeSpy.mockImplementationOnce(() => {
        throw new Error('Token has expired')
      })

      mockCacheGet.mockResolvedValue(mockGoodUserSession)
      mockWreckPost.mockResolvedValueOnce({
        payload: mockTokenPayload
      })

      const result = await validateToken(mockRequest, mockSession)
      expect(result).toEqual({ isValid: true })
      expect(mockCacheSet).toHaveBeenCalledWith(mockSession.sessionId, mockGoodUserSession)
    })

    it('should return isValid false when no session is found in the cache', async () => {
      mockCacheGet.mockResolvedValue(null)
      const result = await validateToken(mockRequest, mockSession)
      expect(result).toEqual({ isValid: false })
    })
  })
})
