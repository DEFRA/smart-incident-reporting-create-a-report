const onPostHandler = {
  plugin: {
    name: 'on-post-handler',
    register: (server, _options) => {
      server.ext('onPostHandler', async (request, h) => {
        if (request.response.variety === 'view' && request.method === 'get') {
          request.response.headers['cache-control'] = 'no-cache, no-store, must-revalidate'

          const context = request.response.source.context || {}
          context.auth = request.auth

          // apply auth to context
          request.response.source.context = context
        }
        return h.continue
      })
    }
  }
}

export default onPostHandler
