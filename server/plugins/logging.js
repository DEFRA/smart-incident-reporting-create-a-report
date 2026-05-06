import config from '../utils/config.js'
import HapiPino from 'hapi-pino'

export default {
  plugin: HapiPino,
  options: {
    logPayload: true,
    level: config.logLevel,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers'],
      remove: true
    },
    ignorePaths: [
      '/public/stylesheets/application.css',
      '/public/js/core.js',
      '/public/js/cookies.js',
      '/public/js/locationMap.js',
      '/public/govuk-frontend.min.js',
      '/public/images/favicon.svg',
      '/public/images/favicon.ico',
      '/public/images/govuk-crest.svg',
      '/public/images/govuk-icon-mask.svg',
      '/public/govuk-frontend.min.js.map',
      '/public/images/govuk-icon-180.png',
      '/public/images/govuk-icon-192.png',
      '/public/images/govuk-icon-512.png',
      '/public/stylesheets/application.css.map',
      '/public/css/accessible-autocomplete.min.css.map',
      '/public/manifest.json',
      '/public/fonts/light-94a07e06a1-v2.woff2',
      '/public/fonts/bold-b542beb274-v2.woff2'
    ]
  }
}
