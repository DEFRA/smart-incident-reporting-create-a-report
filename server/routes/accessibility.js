const handlers = {
  get: (_request, h) => {
    return h.view('accessibility')
  }
}

export default [
  {
    method: 'GET',
    path: '/accessibility',
    handler: handlers.get
  }
]