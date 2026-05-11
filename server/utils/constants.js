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
const SIGNED_OUT = 'signed-out'
const CREATE_REPORT_CANCEL = 'create-report/cancel'
const CREATE_A_REPORT = 'create-a-report'
const CHECK_REPORTER_TYPE = 'check-reporter-type'
const CHECK_AND_SUBMIT_REPORT = 'check-and-submit-report'
const REPORT_SUBMITTED = 'report-submitted'
const ACCESSIBILITY = 'accessibility'
const PRIVACY_NOTICE = 'privacy-notice'

// API
const API_OS_API_TOKEN = 'api/os-api-token'

// Meta data
const POSTCODE_DETAILS = 'postcode-details'
const BUILDING_DATA = 'building-data'
const CHOOSE_ADDRESS = 'choose-address'
const SELECTED_ADDRESS = 'selected-address'
const SELECTED_ADDRESS_DATA = 'selected-address-data'
const POST_DATA_RECOVERY = 'post-data-recovery'

const views = {
  API_OS_API_TOKEN,
  ERROR,
  PUBLIC,
  HOME,
  SERVICE_UNAVAILABLE,
  SIGNOUT,
  SIGNED_OUT,
  CREATE_A_REPORT,
  CHECK_REPORTER_TYPE,
  CHECK_AND_SUBMIT_REPORT,
  CREATE_REPORT_CANCEL,
  REPORT_SUBMITTED,
  ACCESSIBILITY,
  PRIVACY_NOTICE
}

const routes = {}

for (const [key, value] of Object.entries(views)) {
  routes[key] = `/${value}`
}

const redisKeys = {
  ...views,
  POSTCODE_DETAILS,
  BUILDING_DATA,
  CHOOSE_ADDRESS,
  SELECTED_ADDRESS,
  SELECTED_ADDRESS_DATA,
  POST_DATA_RECOVERY
}

const postPayloadDataPaths = new Set([
  routes.CREATE_A_REPORT,
  routes.CHECK_REPORTER_TYPE,
  routes.CREATE_REPORT_CANCEL,
  routes.CHECK_AND_SUBMIT_REPORT
])

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
  postPayloadDataPaths,
  statusCodes,
  urls,
  redisKeys,
  errorSummary,
  phoneRegex
})
