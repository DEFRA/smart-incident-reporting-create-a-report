import onPostAuthHandler from '../on-post-auth-handler.js'
// import { getServer } from '../../../.jest/setup.js'

describe('on-post-auth-handler', () => {
  it('is a plugin', () => {
    expect(onPostAuthHandler.plugin.name).toEqual('on-post-auth-handler')
    expect(typeof onPostAuthHandler.plugin.register).toEqual('function')
  })

  // it('should continue if method is not POST', async () => {

  // })
})
