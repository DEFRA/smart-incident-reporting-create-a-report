const urls = {
  GOV_UK_HOME: 'https://www.gov.uk',
  GOV_UK_SERVICE_HOME:
    'https://www.gov.uk/report-an-environmental-incident'
}

const phoneRegex = /^[\d-+()#]*$/

const ERROR = 'error'
const PUBLIC = 'public'
const HOME = 'home'
const SERVICE_UNAVAILABLE = 'service-unavailable'
const SIGNOUT = 'signout'

const CREATE_A_REPORT = 'create-a-report'
const CHECK_AND_SUBMIT = 'check-and-submit'

const views = {
  ERROR,
  PUBLIC,
  HOME,
  SERVICE_UNAVAILABLE,
  SIGNOUT,
  CREATE_A_REPORT,
  CHECK_AND_SUBMIT
}

const routes = {
  ...views
}

for (const [key, value] of Object.entries(views)) {
  routes[key] = `/${value}`
}

const redisKeys = {
  ...views
}

const statusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  REDIRECT: 302,
  UNAUTHORIZED: 401,
  PAGE_NOT_FOUND: 404,
  REQUEST_TIMEOUT: 408,
  PAYLOAD_TOO_LARGE: 413,
  PROBLEM_WITH_SERVICE: 500,
  SERVICE_UNAVAILABLE: 503
}

const errorSummary = {
  titleText: 'There is a problem',
  errorList: []
}

export default Object.freeze({
  routes,
  views,
  statusCodes,
  urls,
  redisKeys,
  errorSummary,
  phoneRegex
})
