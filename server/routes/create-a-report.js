import constants from '../utils/constants.js'
// import { questionSets } from '../../node_modules/@defra/smart-incident-reporting/server/utils/question-sets.js'

const handlers = {
  get: async (_request, h) => {
    // console.log(questionSets)
    return h.view(constants.views.CREATE_A_REPORT, {
      ...getContext()
    })
  },
  post: async (request, h) => {
    console.log(request.payload)
    return h.redirect(constants.routes.CREATE_A_REPORT)
  }
}

const getContext = () => {
  return {
    pageTitle: ''
  }
}

export default [
  {
    method: 'GET',
    path: constants.routes.CREATE_A_REPORT,
    handler: handlers.get
  }, {
    method: 'POST',
    path: constants.routes.CREATE_A_REPORT,
    handler: handlers.post
  }
]
