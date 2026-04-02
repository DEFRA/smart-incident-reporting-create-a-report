import getBearerToken from '../get-bearer-token.js'
import axios from 'axios'

jest.mock('axios', () => ({
  request: jest.fn()
}))

describe('getBearerToken', () => {
  const config = {
    url: 'https://api.os.uk/oauth2/token/v1',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret'
  }

  it('Should return token data on success', async () => {
    const mockToken = { access_token: 'abc123', expires_in: 3600 }
    axios.request.mockResolvedValue({ data: mockToken })

    const result = await getBearerToken(config)

    expect(result).toEqual(mockToken)
  })

  it('Should call axios.request with correct options', async () => {
    axios.request.mockResolvedValue({ data: {} })

    await getBearerToken(config)

    expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      url: config.url,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      auth: {
        username: config.clientId,
        password: config.clientSecret
      }
    }))
  })

  it('Should include grant_type=client_credentials in request body', async () => {
    axios.request.mockResolvedValue({ data: {} })

    await getBearerToken(config)

    const callArgs = axios.request.mock.calls[0][0]
    expect(callArgs.data).toContain('grant_type=client_credentials')
  })

  it('Should not include scope in request body when scope is not provided', async () => {
    axios.request.mockResolvedValue({ data: {} })

    await getBearerToken(config)

    const callArgs = axios.request.mock.calls[0][0]
    expect(callArgs.data).not.toContain('scope')
  })

  it('Should include scope in request body when scope is provided', async () => {
    axios.request.mockResolvedValue({ data: {} })

    await getBearerToken({ ...config, scope: 'test-scope' })

    const callArgs = axios.request.mock.calls[0][0]
    expect(callArgs.data).toContain('scope=test-scope')
  })

  it('Should throw when axios.request rejects', async () => {
    axios.request.mockRejectedValue(new Error('Network error'))

    await expect(getBearerToken(config)).rejects.toThrow('Network error')
  })
})
