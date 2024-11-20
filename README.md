# Smart Incident Reporting - ICS Create a report

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_smart-incident-reporting-create-a-report&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_smart-incident-reporting-create-a-report)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_smart-incident-reporting-create-a-report&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=DEFRA_smart-incident-reporting-create-a-report)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_smart-incident-reporting-create-a-report&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_smart-incident-reporting-create-a-report)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_smart-incident-reporting-create-a-report&metric=bugs)](https://sonarcloud.io/summary/new_code?id=DEFRA_smart-incident-reporting-create-a-report)

# Prerequisites

NodeJS v18 needs to be installed locally along with npm.

# Getting started

Install dependencies and build the application via

```sh
$ npm i
```

# Run tests

```sh
$ npm test
```

# Build backend and start services

```sh
$ npm run start-backend
```

# Start application

```sh
$ npm run dev
or
$ npm run start
```

# Docker 

Create secrets file in docker/secrets/WEBAPP_ENV that exports the mandatory env vars:
eg:
```
export REDIS_HOST=redis
export REDIS_PORT=6379
export NODE_ENV=production
export SERVICE_BUS_QUEUE_NAME=****
export SERVICE_BUS_CONNECTION_STRING=****
export AAD_CLIENT_ID=****
export AAD_CLIENT_SECRET=****
export AAD_TENANT=****
```

Build the image
```sh
docker compose -f docker/service-local.yml build
```
Run the container
```sh
docker-compose -f docker/service-local.yml up
```

## Project structure

Here's the default structure for your project files.

- **bin** (build tasks)
- **client** (client js/sass code)
- **server**
  - **plugins**
  - **public** (This folder is publicly served)
    - **static** (Put all static assets in here)
    - **build** (This contains the build output files (js/css etc.) and is not checked-in)
  - **routes**
  - **services**
  - **views**
  - config.js
  - index.js (Exports a function that creates a server)
- **tests**
- README.md
- index.js (startup server)

## Config

The configuration file for the server is found at `server/config.js`.
This is where to put any config and all config should be read from the environment.
The final config object should be validated using joi and the application should not start otherwise.

A table of environment variables should be maintained in this README.

## Plugins

hapi has a powerful plugin system and all server code should be loaded in a plugin.

Plugins live in the `server/plugins` directory.

## Logging

Logging is carried out using [hapi-pino](https://github.com/pinojs/hapi-pino#readme) and [Application Insights](https://github.com/microsoft/ApplicationInsights-node.js#readme).

## Views

The [vison](https://github.com/hapijs/vision) plugin is used for template rendering support.

The template engine used in nunjucks inline with the GDS Design System with support for view caching, layouts, partials and helpers.

## Static files

The [Inert](https://github.com/hapijs/inert) plugin is used for static file and directory handling in hapi.js.
Put all static assets in `server/public/static`.

Any build output should write to `server/public/build`. This path is in the `.gitignore` and is therefore not checked into source control.

## Routes

Incoming requests are handled by the server via routes.
Each route describes an HTTP endpoint with a path, method, and other properties.

Routes are found in the `server/routes` directory and loaded using the `server/plugins/router.js` plugin.

Hapi supports registering routes individually or in a batch.
Each route file can therefore export a single route object or an array of route objects.

A single route looks like this:

```js
{
  method: 'GET',
  path: '/hello-world',
  options: {
    handler: (request, h) => {
      return 'hello world'
    }
  }
}
```

There are lots of [route options](http://hapijs.com/api#route-options), here's the documentation on [hapi routes](http://hapijs.com/tutorials/routing)

## Tasks

Build tasks are created using simple shell scripts or node.js programs.
The default ones are found in the `bin` directory.

The task runner is simply `npm` using `npm-scripts`.

The predefined tasks are:

- `npm start` (Runs the application)
- `npm run build` (Runs all build sub-tasks)
- `npm run build:css` (Builds the client-side sass)
- `npm run lint` (Runs the lint task using standard.js)
- `npm run unit-test` (Runs the `lab` tests in the `/tests` folder)
- `npm test` (Runs the `lint` task then the `unit-tests`)

## Testing

[Jest](https://jestjs.io/) is used for unit testing.

See the `/tests` folder for more information.

## Linting

[standard.js](http://standardjs.com/) is used to lint both the server-side and client-side javascript code.

It's defined as a build task and can be run using `npm run lint`.


# Environment variables

The build of the webapp requires an environment variable GA_ID if google analytics is required

| name    | description | mandatory | default value |
|---------|-------------|-----------| ------------- |
| 	NODE_ENV	 | 	Environment, eg development, test, production	 | 	N	 |	development	 |
| 	SERVICE_PORT	 | 	Port for sevice to run on eg 8000	 | 	N	 |	8000	 |
| 	LOG_LEVEL	 | 	Log level eg info, warn, error	 | 	N	 |	warn	 |
| 	REDIS_HOST	 | 	Redis host name	 | 	Y	 |		 |
| 	REDIS_PORT	 | 	Redis port name	 | 	N	 |	6379	 |
| 	REDIS_PASSWORD	 | 	Redis password	 | 	Y	 |		 |
| 	REDIS_TLS	 | 	Redis tls eg true or false	 | 	N	 |	FALSE	 |
| 	SESSION_COOKIE_PASSWORD	 | 	Cookie password min 32 characters	 | 	N	 |	the-password-must-be-at-least-32-characters-long	 |
| 	COOKIE_IS_SECURE	 | 	Cookie secure boolean	 | 	N	 |	FALSE	 |
| 	OS_SECRET	 | 	OS API secret	 | 	Y	 |		 |
| 	OS_KEY	 | 	OS API key	 | 	Y	 |		 |
| 	SERVICE_BUS_CONNECTION_STRING	 | 	Service bus connection string	 | 	Y	 |		 |
| 	SERVICE_BUS_QUEUE_NAME	 | 	Service bus queue name	 | 	Y	 |		 |
|   GA_ID   |   Google tag manager ID   |   N   |   |
|   AAD_CLIENT_ID   |   Azure active directory client ID   |   Y   |   |
|   AAD_CLIENT_SECRET   |   Azure active directory client secret   |   Y   |   |
|   AAD_TENANT   |   Azure active directory tenant   |   Y   |   |
