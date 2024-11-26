import { createServer, init } from "../server/index.js"
import serverOptions from '../server/__test-helpers__/server-options.js'
import Bell from '@hapi/bell'
const ORIGINAL_ENV = process.env

let server, context

beforeEach(async () => {
  jest.resetAllMocks()
  // add any common mockage here, eg json POSTs
  
  // Mock the azure-auth Bell object with the following response
  Bell.simulate((request) => {
    return {      
      profile: {
        id: 1,
        displayName: 'Smith, John',
        email: 'test@test.com'
      }     
    }
  })
  server = await createServer(serverOptions)
  await init(server)
})

afterEach(async () => {
  try {
    if (server) {
      await server.stop()
    }
  } finally {
    // reset environment variables after test
    process.env = { ...ORIGINAL_ENV }
  }
})

const getServer = () => server

const getContext = () => context

export { getServer, getContext }
