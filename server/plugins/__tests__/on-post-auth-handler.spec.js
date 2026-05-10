import onPostAuthHandler from '../on-post-auth-handler.js'
import { submitPostRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'

describe('on-post-auth-handler', () => {
  it('is a plugin', () => {
    expect(onPostAuthHandler.plugin.name).toEqual('on-post-auth-handler')
    expect(typeof onPostAuthHandler.plugin.register).toEqual('function')
  })

  it('should continue if method is not POST', async () => {
    const options = {
      url: constants.routes.CHECK_REPORTER_TYPE,
      auth: undefined,
      payload: {
        test: 'data'
      }
    }

    const response = await submitPostRequest(options, 302)
    expect(response.headers.location).toEqual('/')
    expect(response.request.yar.get(constants.redisKeys.POST_DATA_RECOVERY)).toEqual(expect.objectContaining({
      path: '/check-reporter-type',
      payload: {
        test: 'data'
      }
    }))
  })

  it('should continue if path is not in post payload recovery paths', async () => {
    const options = {
      url: constants.routes.CHECK_REPORTER_TYPE,
      payload: {
        reporterType: 'water',
        reporterWaterName: 'Thames Water Utilities Ltd',
        reporterOtherName: 'Old other value',
        reporterRole: 'Old role value'
      }
    }

    const sessionData = {
      'create-a-report': {
        reporterEmail: 'user@thameswater.co.uk',
        reporterType: 'public',
        reporterWaterName: '',
        reporterOtherName: '',
        reporterRole: ''
      }
    }

    const paths = constants.postPayloadDataPaths
    paths.delete(options.url)

    const response = await submitPostRequest(options, 302, sessionData)
    expect(response.headers.location).toEqual(constants.routes.CHECK_AND_SUBMIT_REPORT)
    expect(response.request.yar.get(constants.redisKeys.CREATE_A_REPORT)).toEqual(expect.objectContaining({
      reporterType: 'water',
      reporterWaterName: 'Thames Water Utilities Ltd',
      reporterOtherName: '',
      reporterRole: ''
    }))
  })
})
