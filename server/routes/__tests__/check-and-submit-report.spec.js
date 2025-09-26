import { submitGetRequest, submitPostRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'
import moment from 'moment'
import { sendMessage } from '@defra/smart-incident-reporting/server/services/service-bus.js'
jest.mock('@defra/smart-incident-reporting/server/services/service-bus.js')

const url = constants.routes.CHECK_AND_SUBMIT_REPORT

const getSessionData = () => {
  return JSON.parse(JSON.stringify(sessionData))
}

const sessionData = {
  'create-a-report': {
    action: 'check-report',
    dateObserved: 'before',
    dateOtherDay: '01',
    dateOtherMonth: '12',
    dateOtherTime: '09:00',
    dateOtherYear: '2024',
    dateTime: '',
    descriptionDescription: 'Incident description',
    descriptionEmailReportDateDay: '03',
    descriptionEmailReportDateMonth: '12',
    descriptionEmailReportDateYear: '2024',
    descriptionEmailReportTime: '08:00',
    descriptionIncidentType: '100',
    descriptionReportedByEmail: 'true',
    locationDescription: 'Location description',
    locationGridRef: 'SJ 67084 44110',
    locationOfIncident: 'gridReference',
    reporterEmail: 'test@Test.com',
    reporterFirstName: 'John',
    reporterLastName: 'Smith',
    reporterPhone: '01234567890',
    reporterReference: 'REF1234567890',
    reporterType: 'water',
    reporterWaterName: 'Water Services Ltd',
    reporterPhotos: 'Yes',
    reporterRole: 'Jam'
  },
  'selected-address': {
    addressLine1: '10, Watermill Lane',
    townOrCity: 'Hertford',
    postcode: 'SG14 3LB'
  },
  'selected-address-data': [
    {
      uprn: '2',
      postcodeDetails: 'SG14 3LB',
      address: '10, Watermill Lane, Hertford, SG14 3LB',
      x: 100001,
      y: 100001
    }
  ]
}

const answerId = 2
const answerDetails = 'Test reason for categorisation'

describe(url, () => {
  describe('GET', () => {
    it(`Should return success response and correct view for ${url} if sessiondata is present and correct`, async () => {
      await submitGetRequest({ url }, 'Check and submit report', 200, getSessionData())
    })

    it(`Should return success response and correct view for ${url} if sessiondata with address is present and correct`, async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].locationOfIncident = 'address'
      sessionData['create-a-report'].buildingDetails = '10'
      sessionData['create-a-report'].postcodeDetails = 'SG143LB'
      sessionData['create-a-report'].addressId = '1'

      await submitGetRequest({ url }, 'Check and submit report', 200, sessionData)
    })

    it('Should redirect to create a report if report data is invalid', async () => {
      const response = await submitGetRequest({ url }, undefined, 302)
      expect(response.headers.location).toEqual(constants.routes.CREATE_A_REPORT)
    })

    it(`Happy: Should return 12 character NGR value with the required spaces when locationGridRef has no spaces ${url}`, async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].locationGridRef = 'SJ6708444110'
      const response = await submitGetRequest({ url }, 'Check and submit report', constants.statusCodes.OK, sessionData)
      expect(response.payload).toContain('SJ 67084 44110')
    })
    it(`Happy: Should return 12 character NGR value with the required spaces when locationGridRef has spaces ${url}`, async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].locationGridRef = 'SJ 67084 44110'
      const response = await submitGetRequest({ url }, 'Check and submit report', constants.statusCodes.OK, sessionData)
      expect(response.payload).toContain('SJ 67084 44110')
    })
  })
  describe('POST', () => {
    it('Should post payload to service bus and set REPORT_SUBMITTED to true', async () => {
      const sessionData = getSessionData()
      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.request.yar.get(constants.redisKeys.REPORT_SUBMITTED)).toEqual(true)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
        info: expect.any(Function)
      }),
      expect.objectContaining({
        reportingAnEnvironmentalProblem: expect.objectContaining({
          reportType: 100,
          reporterName: sessionData['create-a-report'].reporterFirstName + ' ' + sessionData['create-a-report'].reporterLastName,
          reporterPhoneNumber: sessionData['create-a-report'].reporterPhone,
          reporterEmailAddress: sessionData['create-a-report'].reporterEmail,
          otherDetails: sessionData['create-a-report'].descriptionDescription,
          questionSetId: 0,
          incidentCategory: 2,
          reasonForCategorisation: 'Test reason for categorisation',
          loggedByDisplayName: 'Smith, John',
          loggedByUserPrincipalName: 'test@test.com',
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 3800,
              questionAsked: 'Reported by email?',
              questionResponse: true,
              answerId: 3801
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Has photos or videos of problem',
              questionResponse: true,
              answerId: 3901
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 4101,
              otherDetails: 'SJ 67084 44110'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2702,
              otherDetails: '367084'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2703,
              otherDetails: '344110'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2704,
              otherDetails: '-2.491836'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2705,
              otherDetails: '52.993316'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 4102,
              otherDetails: 'Location description'
            }),
            expect.objectContaining({
              questionId: 4000,
              questionAsked: 'Type of reporter',
              questionResponse: true,
              answerId: 4001,
              otherDetails: 'Water Company'
            }),
            expect.objectContaining({
              questionId: 4000,
              questionAsked: 'Type of reporter',
              questionResponse: true,
              answerId: 4003,
              otherDetails: 'Water Services Ltd'
            })
          ])
        })
      }))
    })

    it('Should post payload with the formatted location grid reference to service bus and set REPORT_SUBMITTED to true', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].locationGridRef = 'SJ6708444110'
      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.request.yar.get(constants.redisKeys.REPORT_SUBMITTED)).toEqual(true)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
        info: expect.any(Function)
      }),
      expect.objectContaining({
        reportingAnEnvironmentalProblem: expect.objectContaining({
          reportType: 100,
          questionSetId: 0,
          incidentCategory: 2,
          reasonForCategorisation: 'Test reason for categorisation',
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 4101,
              otherDetails: 'SJ 67084 44110'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2702,
              otherDetails: '367084'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2703,
              otherDetails: '344110'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2704,
              otherDetails: '-2.491836'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2705,
              otherDetails: '52.993316'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 4102,
              otherDetails: 'Location description'
            })
          ])
        })
      }))
    })

    it('Should generate correct payload for address location', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].locationOfIncident = 'address'
      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.request.yar.get(constants.redisKeys.REPORT_SUBMITTED)).toEqual(true)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
        info: expect.any(Function)
      }),
      expect.objectContaining({
        reportingAnEnvironmentalProblem: expect.objectContaining({
          reportType: 100,
          reporterName: sessionData['create-a-report'].reporterFirstName + ' ' + sessionData['create-a-report'].reporterLastName,
          reporterPhoneNumber: sessionData['create-a-report'].reporterPhone,
          reporterEmailAddress: sessionData['create-a-report'].reporterEmail,
          otherDetails: sessionData['create-a-report'].descriptionDescription,
          questionSetId: 0,
          incidentCategory: 2,
          reasonForCategorisation: 'Test reason for categorisation',
          loggedByDisplayName: 'Smith, John',
          loggedByUserPrincipalName: 'test@test.com',
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2702,
              otherDetails: '100001'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2703,
              otherDetails: '100001'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2704,
              otherDetails: '-6.252067'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2705,
              otherDetails: '50.721988'
            }),
            expect.objectContaining({
              questionId: 1400,
              questionAsked: 'Enter your address',
              questionResponse: true,
              answerId: 1401,
              otherDetails: '10, Watermill Lane'
            }),
            expect.objectContaining({
              questionId: 1400,
              questionAsked: 'Enter your address',
              questionResponse: true,
              answerId: 1403,
              otherDetails: 'Hertford'
            }),
            expect.objectContaining({
              questionId: 1400,
              questionAsked: 'Enter your address',
              questionResponse: true,
              answerId: 1405,
              otherDetails: 'SG14 3LB'
            })
          ])
        })
      }))
    })

    it('Edge cases for payload data - 1', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].descriptionReportedByEmail = ''
      sessionData['create-a-report'].reporterType = 'other'
      sessionData['create-a-report'].reporterOtherName = 'Other Organisation Name'
      sessionData['create-a-report'].locationDescription = ''
      sessionData['create-a-report'].reporterPhotos = 'No'
      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.request.yar.get(constants.redisKeys.REPORT_SUBMITTED)).toEqual(true)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
        info: expect.any(Function)
      }),
      expect.objectContaining({
        reportingAnEnvironmentalProblem: expect.objectContaining({
          reportType: 100,
          reporterName: sessionData['create-a-report'].reporterFirstName + ' ' + sessionData['create-a-report'].reporterLastName,
          reporterPhoneNumber: sessionData['create-a-report'].reporterPhone,
          reporterEmailAddress: sessionData['create-a-report'].reporterEmail,
          otherDetails: sessionData['create-a-report'].descriptionDescription,
          questionSetId: 0,
          incidentCategory: 2,
          reasonForCategorisation: 'Test reason for categorisation',
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 3800,
              questionAsked: 'Reported by email?',
              questionResponse: true,
              answerId: 3802
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Has photos or videos of problem',
              questionResponse: true,
              answerId: 3902
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 4101,
              otherDetails: 'SJ 67084 44110'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2702,
              otherDetails: '367084'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2703,
              otherDetails: '344110'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2704,
              otherDetails: '-2.491836'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2705,
              otherDetails: '52.993316'
            }),
            expect.objectContaining({
              questionId: 4000,
              questionAsked: 'Type of reporter',
              questionResponse: true,
              answerId: 4002,
              otherDetails: 'Public organisation'
            }),
            expect.objectContaining({
              questionId: 4000,
              questionAsked: 'Type of reporter',
              questionResponse: true,
              answerId: 4003,
              otherDetails: 'Other Organisation Name'
            })
          ])
        })
      }))
    })

    it('Edge cases for payload data - 2 : data with member of public', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].descriptionReportedByEmail = ''
      sessionData['create-a-report'].reporterType = 'public'
      sessionData['create-a-report'].locationDescription = ''
      sessionData['create-a-report'].reporterPhotos = 'No'
      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.request.yar.get(constants.redisKeys.REPORT_SUBMITTED)).toEqual(true)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
        info: expect.any(Function)
      }),
      expect.objectContaining({
        reportingAnEnvironmentalProblem: expect.objectContaining({
          reportType: 100,
          reporterName: sessionData['create-a-report'].reporterFirstName + ' ' + sessionData['create-a-report'].reporterLastName,
          reporterPhoneNumber: sessionData['create-a-report'].reporterPhone,
          reporterEmailAddress: sessionData['create-a-report'].reporterEmail,
          otherDetails: sessionData['create-a-report'].descriptionDescription,
          questionSetId: 0,
          incidentCategory: 2,
          reasonForCategorisation: 'Test reason for categorisation',
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 3800,
              questionAsked: 'Reported by email?',
              questionResponse: true,
              answerId: 3802
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Has photos or videos of problem',
              questionResponse: true,
              answerId: 3902
            }),
            expect.objectContaining({
              questionId: 4000,
              questionAsked: 'Type of reporter',
              questionResponse: true,
              answerId: 4004,
              otherDetails: 'Member of public'
            })
          ])
        })
      }))
    })

    it('Edge cases for payload data - 3: data with member of public and anonymous', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].reporterFirstName = ''
      sessionData['create-a-report'].reporterLastName = ''
      sessionData['create-a-report'].reporterEmail = ''
      sessionData['create-a-report'].reporterPhone = ''
      sessionData['create-a-report'].descriptionReportedByEmail = ''
      sessionData['create-a-report'].reporterType = 'public'
      sessionData['create-a-report'].locationDescription = ''
      sessionData['create-a-report'].reporterPhotos = 'No'
      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.request.yar.get(constants.redisKeys.REPORT_SUBMITTED)).toEqual(true)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
        info: expect.any(Function)
      }),
      expect.objectContaining({
        reportingAnEnvironmentalProblem: expect.objectContaining({
          reportType: 100,
          reporterName: ' ',
          reporterPhoneNumber: '',
          reporterEmailAddress: '',
          otherDetails: sessionData['create-a-report'].descriptionDescription,
          questionSetId: 0,
          incidentCategory: 2,
          reasonForCategorisation: 'Test reason for categorisation',
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 3800,
              questionAsked: 'Reported by email?',
              questionResponse: true,
              answerId: 3802
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Has photos or videos of problem',
              questionResponse: true,
              answerId: 3902
            }),
            expect.objectContaining({
              questionId: 4000,
              questionAsked: 'Type of reporter',
              questionResponse: true,
              answerId: 4006,
              otherDetails: 'Anonymous'
            })
          ])
        })
      }))
    })

    it('Edge cases for payload data - 4', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].descriptionReportedByEmail = ''
      sessionData['create-a-report'].reporterType = ''
      sessionData['create-a-report'].reporterOtherName = ''
      sessionData['create-a-report'].locationDescription = ''
      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.request.yar.get(constants.redisKeys.REPORT_SUBMITTED)).toEqual(true)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
        info: expect.any(Function)
      }),
      expect.objectContaining({
        reportingAnEnvironmentalProblem: expect.objectContaining({
          reportType: 100,
          reporterName: sessionData['create-a-report'].reporterFirstName + ' ' + sessionData['create-a-report'].reporterLastName,
          reporterPhoneNumber: sessionData['create-a-report'].reporterPhone,
          reporterEmailAddress: sessionData['create-a-report'].reporterEmail,
          otherDetails: sessionData['create-a-report'].descriptionDescription,
          questionSetId: 0,
          incidentCategory: 2,
          reasonForCategorisation: 'Test reason for categorisation',
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 3800,
              questionAsked: 'Reported by email?',
              questionResponse: true,
              answerId: 3802
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Has photos or videos of problem',
              questionResponse: true,
              answerId: 3901
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 4101,
              otherDetails: 'SJ 67084 44110'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2702,
              otherDetails: '367084'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2703,
              otherDetails: '344110'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2704,
              otherDetails: '-2.491836'
            }),
            expect.objectContaining({
              questionId: 4100,
              questionAsked: 'Location of incident',
              questionResponse: true,
              answerId: 2705,
              otherDetails: '52.993316'
            })
          ])
        })
      }))
    })

    it('Should fail payload validation if invalid payload with 500 server error', async () => {
      const sessionData = getSessionData()
      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      sessionData['create-a-report'].descriptionIncidentType = 'rwrewr'

      const response = await submitPostRequest(options, 500, sessionData)
      expect(response.payload).toContain('<h1 class="govuk-heading-l">Sorry, there is a problem with the service</h1>')
    })
    // date edge cases
    // other date
    it('Date set to today', async () => {
      const today = new Date(new Date().toDateString())
      sessionData['create-a-report'].dateObserved = 'today'
      sessionData['create-a-report'].dateTime = '00:00'
      sessionData['create-a-report'].descriptionEmailReportDateDay = today.getDate().toString()
      sessionData['create-a-report'].descriptionEmailReportDateMonth = (today.getMonth() + 1).toString()
      sessionData['create-a-report'].descriptionEmailReportDateYear = today.getFullYear().toString()
      sessionData['create-a-report'].descriptionEmailReportTime = '00:00'

      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.request.yar.get(constants.redisKeys.REPORT_SUBMITTED)).toEqual(true)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
        info: expect.any(Function)
      }),
      expect.objectContaining({
        reportingAnEnvironmentalProblem: expect.objectContaining({
          reportType: 100,
          questionSetId: 0,
          incidentCategory: 2,
          reasonForCategorisation: 'Test reason for categorisation',
          datetimeObserved: today.toISOString(),
          datetimeReported: today.toISOString()
        })
      }))
    })

    it('Date set to yesterday', async () => {
      const sessionData = getSessionData()
      const yesterday = new Date(new Date().toDateString())
      yesterday.setDate(yesterday.getDate() - 1)
      sessionData['create-a-report'].dateObserved = 'yesterday'
      sessionData['create-a-report'].dateTime = '00:00'
      sessionData['create-a-report'].descriptionEmailReportDateDay = yesterday.getDate().toString()
      sessionData['create-a-report'].descriptionEmailReportDateMonth = (yesterday.getMonth() + 1).toString()
      sessionData['create-a-report'].descriptionEmailReportDateYear = yesterday.getFullYear().toString()
      sessionData['create-a-report'].descriptionEmailReportTime = '00:00'

      // date.setDate(date.getDate() - 1)

      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.request.yar.get(constants.redisKeys.REPORT_SUBMITTED)).toEqual(true)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
        info: expect.any(Function)
      }),
      expect.objectContaining({
        reportingAnEnvironmentalProblem: expect.objectContaining({
          reportType: 100,
          questionSetId: 0,
          incidentCategory: 2,
          reasonForCategorisation: 'Test reason for categorisation',
          datetimeObserved: yesterday.toISOString(),
          datetimeReported: yesterday.toISOString()
        })
      }))
    })

    it('Date set to before', async () => {
      const sessionData = getSessionData()
      const before = new Date(new Date().toDateString())
      before.setDate(before.getDate() - 182) // by going back 6 months we should hopefully test GMT and BST via today's date in previous test and this date
      sessionData['create-a-report'].dateObserved = 'before'
      sessionData['create-a-report'].dateOtherDay = before.getDate().toString()
      sessionData['create-a-report'].dateOtherMonth = (before.getMonth() + 1).toString()
      sessionData['create-a-report'].dateOtherYear = before.getFullYear().toString()
      sessionData['create-a-report'].dateOtherTime = '00:00'
      sessionData['create-a-report'].descriptionEmailReportDateDay = before.getDate().toString()
      sessionData['create-a-report'].descriptionEmailReportDateMonth = (before.getMonth() + 1).toString()
      sessionData['create-a-report'].descriptionEmailReportDateYear = before.getFullYear().toString()
      sessionData['create-a-report'].descriptionEmailReportTime = '00:00'

      // date.setDate(date.getDate() - 1)

      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.request.yar.get(constants.redisKeys.REPORT_SUBMITTED)).toEqual(true)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
        info: expect.any(Function)
      }),
      expect.objectContaining({
        reportingAnEnvironmentalProblem: expect.objectContaining({
          reportType: 100,
          questionSetId: 0,
          incidentCategory: 2,
          reasonForCategorisation: 'Test reason for categorisation',
          datetimeObserved: before.toISOString(),
          datetimeReported: before.toISOString()
        })
      }))
    })

    it('Sad: errors on no answerId', async () => {
      const sessionData = getSessionData()
      const options = {
        url,
        payload: {}
      }
      const response = await submitPostRequest(options, constants.statusCodes.OK, sessionData)
      expect(response.payload).toContain('There is a problem')
      expect(response.payload).toContain('Select an incident category')
      expect(response.payload).toContain('Enter a reason for the selected categorisation')
    })

    it('Date of incident set to now', async () => {
      const date = new Date(new Date().toDateString())
      const currentTime = moment().format('HH:mm')
      const timeParts = currentTime.split(':')
      date.setHours(timeParts[0]?.padStart(2, '0'))
      date.setMinutes(timeParts[1]?.padStart(2, '0'))
      const dateTimeofIncident = date.toISOString()
      sessionData['create-a-report'].dateObserved = 'now'
      sessionData['create-a-report'].dateTime = ''
      sessionData['create-a-report'].descriptionReportedByEmail = ''
      sessionData['create-a-report'].descriptionEmailReportDateDay = ''
      sessionData['create-a-report'].descriptionEmailReportDateMonth = ''
      sessionData['create-a-report'].descriptionEmailReportDateYear = ''
      sessionData['create-a-report'].descriptionEmailReportTime = ''
      sessionData['create-a-report'].nowTime = currentTime

      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.request.yar.get(constants.redisKeys.REPORT_SUBMITTED)).toEqual(true)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
        info: expect.any(Function)
      }),
      expect.objectContaining({
        reportingAnEnvironmentalProblem: expect.objectContaining({
          datetimeObserved: dateTimeofIncident
        })
      }))
    })
  })
})
