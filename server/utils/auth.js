import Jwt from '@hapi/jwt'
import Wreck from '@hapi/wreck'
import config from './config.js'

async function isMemberOfRMGroup (request) {
  const targetGroupId = config.rmGroupId
  const { token } = await request.server.app.tokenCache.get(request.auth.credentials.sessionId)
  try {
    const response = await Wreck.post('https://graph.microsoft.com/v1.0/me/checkMemberGroups', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({ groupIds: [targetGroupId] }),
      json: true
    })

    const isMember = (response.payload?.value || []).includes(targetGroupId)
    console.log(`${request.auth.credentials.profile.email} isMember of RM group: ${isMember}`) // Debug log to check group membership response

    return isMember
  } catch (err) {
    console.error(`Error checking group membership for ${request.auth.credentials.profile.email}:`, err)
    return false
  }
}

async function refreshTokens (userSession) {
  const tokenEndpoint = `https://login.microsoftonline.com/${config.aadTenant}/oauth2/v2.0/token`

  const query = [
    `client_id=${config.aadClientId}`,
    `client_secret=${config.aadClientSecret}`,
    'grant_type=refresh_token',
    'scope=offline_access user.read openid profile', // Request same scopes as initial auth + offline_access for refresh token
    `refresh_token=${userSession.refreshToken}`
  ].join('&')

  try {
    const response = await Wreck.post(tokenEndpoint, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payload: query,
      json: true
    })

    return response.payload
  } catch (err) {
    console.error(`Token refresh failed for ${userSession.profile.email}:`, err)
    throw err
  }
}

function getSessionIdFromToken (token) {
  try {
    const { decoded } = Jwt.token.decode(token)
    return decoded.payload?.sid
  } catch (err) {
    console.error('Error decoding token:', err)
    return null
  }
}

export { getSessionIdFromToken, refreshTokens, isMemberOfRMGroup }
