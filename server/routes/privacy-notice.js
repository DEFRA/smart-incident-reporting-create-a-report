const handlers = {
  get: (_request, h) => {
    return h.view('privacy-notice')
  }
}

export default [
  {
    method: 'GET',
    path: '/privacy-notice',
    handler: handlers.get
  }
]
