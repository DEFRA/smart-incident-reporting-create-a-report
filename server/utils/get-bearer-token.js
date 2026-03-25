const getBearerToken = async ({ url, clientId, clientSecret, scope }) => {
  const params = new URLSearchParams()
  params.append('grant_type', 'client_credentials')

  if (scope) {
    params.append('scope', scope)
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Failed to fetch bearer token: ${response.status} ${errorBody}`)
  }

  return response.json()
}

export default getBearerToken
