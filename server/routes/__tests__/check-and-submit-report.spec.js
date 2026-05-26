import { submitGetRequest, submitPostRequest } from '../../__test-helpers__/server.js'
import constants from '../../utils/constants.js'
import moment from 'moment'
import { sendMessage } from '@defra/smart-incident-reporting/server/services/service-bus.js'
import config from '../../utils/config.js'
jest.mock('@defra/smart-incident-reporting/server/services/service-bus.js')

const url = constants.routes.CHECK_AND_SUBMIT_REPORT
const answerId = 2
const answerDetails = 'Test reason for categorisation'

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
    dateTimeToday: '',
    dateTimeYesterday: '',
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
    reporterVideos: 'No',
    reporterHomeAddress: 'Yes',
    reporterRole: 'Jam'
  },
  'selected-address': {
    addressLine1: '10, Watermill Lane',
    addressLine2: null,
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
    it(`Happy: Should return address in 4 lines if addressLine1 exceeds 60 characters ${url}`, async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].locationOfIncident = 'address'
      sessionData['create-a-report'].buildingDetails = '95'
      sessionData['create-a-report'].postcodeDetails = 'BS2 7EB'
      sessionData['create-a-report'].addressId = '1'
      sessionData['selected-address'].addressLine1 = 'Eaglestone Champion Ltd, Unit 95, The Industrial Quarter'
      sessionData['selected-address'].addressLine2 = 'Foxcote Avenue, Bristol Business Park, Peasedown St. John'
      sessionData['selected-address'].townOrCity = 'Bristol'
      sessionData['selected-address'].postcode = 'BS2 7EB'
      const response = await submitGetRequest({ url }, 'Check and submit report', constants.statusCodes.OK, sessionData)
      expect(response.payload).toContain('<br>Foxcote Avenue, Bristol Business Park, Peasedown St. John')
    })

    it('Should render map initialisation script when locationOfIncident is gridReference', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].locationOfIncident = 'gridReference'
      sessionData['create-a-report'].locationGridRef = 'SJ 67084 44110'
      const response = await submitGetRequest({ url }, 'Check and submit report', constants.statusCodes.OK, sessionData)
      expect(response.payload).toContain('incidentLocationMap.initialiseMap')
    })

    it('Should render map initialisation script when locationOfIncident is address', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].locationOfIncident = 'address'
      sessionData['create-a-report'].buildingDetails = '10'
      sessionData['create-a-report'].postcodeDetails = 'SG143LB'
      sessionData['create-a-report'].addressId = '1'
      const response = await submitGetRequest({ url }, 'Check and submit report', constants.statusCodes.OK, sessionData)
      expect(response.payload).toContain('incidentLocationMap.initialiseMap')
    })

    it('Should show home address answer for grid reference location', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].locationOfIncident = 'gridReference'
      sessionData['create-a-report'].reporterHomeAddress = 'Yes'

      const response = await submitGetRequest({ url }, 'Check and submit report', constants.statusCodes.OK, sessionData)
      expect(response.payload).toMatch(/This is the home address[\s\S]*?<dd class="govuk-summary-list__value">\s*Yes\s*<\/dd>/)
    })

    it('Should not render map initialisation script when address has no selected-address-data', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].locationOfIncident = 'address'
      sessionData['create-a-report'].buildingDetails = '10'
      sessionData['create-a-report'].postcodeDetails = 'SG143LB'
      sessionData['create-a-report'].addressId = '1'
      sessionData['selected-address-data'] = []
      const response = await submitGetRequest({ url }, 'Check and submit report', constants.statusCodes.OK, sessionData)
      expect(response.payload).not.toContain('incidentLocationMap.initialiseMap')
    })

    it.each([
      ['Yes', 'Yes', 'Yes - photos<br>Yes - video'],
      ['No', 'No', 'No - photos<br>No - video'],
      ['Yes', 'No', 'Yes - photos<br>No - video'],
      ['No', 'Yes', 'No - photos<br>Yes - video']
    ])('Should show media summary as %s photos and %s video', async (photos, videos, expected) => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].reporterPhotos = photos
      sessionData['create-a-report'].reporterVideos = videos

      const response = await submitGetRequest({ url }, 'Check and submit report', constants.statusCodes.OK, sessionData)
      expect(response.payload).toContain(expected)
    })
  })
  describe('POST', () => {
    const mockIsMemberOfRMGroup = jest.fn()

    jest.mock('../../utils/auth.js', () => ({
      isMemberOfRMGroup: mockIsMemberOfRMGroup
    }))

    beforeEach(() => {
      mockIsMemberOfRMGroup.mockReturnValue(false)
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('Should set mediaUploadCache when reporterPhotos is Yes', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].reporterPhotos = 'Yes'
      const options = {
        url
      }

      const response = await submitPostRequest(options, 302, sessionData)

      await expect(response.request.server.app.mediaUploadCache.get(response.request.yar.id)).resolves.toEqual({ hasPhotos: true })
    })

    it('Should not set mediaUploadCache when reporterPhotos is No', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].reporterPhotos = 'No'
      const options = {
        url
      }

      const response = await submitPostRequest(options, 302, sessionData)

      await expect(response.request.server.app.mediaUploadCache.get(response.request.yar.id)).resolves.toBeNull()
    })

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
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3903
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3906
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
        url
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
        url
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
        url
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
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 3800,
              questionAsked: 'Reported by email?',
              questionResponse: true,
              answerId: 3802
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3904
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3906
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
        url
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
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 3800,
              questionAsked: 'Reported by email?',
              questionResponse: true,
              answerId: 3802
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3904
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3906
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
        url
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
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 3800,
              questionAsked: 'Reported by email?',
              questionResponse: true,
              answerId: 3802
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3904
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3906
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

    it('Should send answerId 3904 (noPhotos) and 3905 (yesVideo) when only video is selected', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].reporterPhotos = 'No'
      sessionData['create-a-report'].reporterVideos = 'Yes'
      const options = {
        url
      }

      await submitPostRequest(options, 302, sessionData)
      expect(sendMessage.mock.calls.at(-1)?.[1]).toEqual(expect.objectContaining({
        reportingAnEnvironmentalProblem: expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3904
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3905
            })
          ])
        })
      }))
    })

    it('Should send answerId 3903 (yesPhotos) and 3905 (yesVideo) when both photos and video are selected', async () => {
      const sessionData = getSessionData()
      sessionData['create-a-report'].reporterPhotos = 'Yes'
      sessionData['create-a-report'].reporterVideos = 'Yes'
      const options = {
        url
      }

      await submitPostRequest(options, 302, sessionData)
      expect(sendMessage.mock.calls.at(-1)?.[1]).toEqual(expect.objectContaining({
        reportingAnEnvironmentalProblem: expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3903
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3905
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
        url
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
          data: expect.arrayContaining([
            expect.objectContaining({
              questionId: 3800,
              questionAsked: 'Reported by email?',
              questionResponse: true,
              answerId: 3802
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3903
            }),
            expect.objectContaining({
              questionId: 3900,
              questionAsked: 'Photos or videos available',
              questionResponse: true,
              answerId: 3906
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
        url
      }

      sessionData['create-a-report'].descriptionIncidentType = 'rwrewr'

      const response = await submitPostRequest(options, 500, sessionData)
      expect(response.payload).toContain('<h1 class="govuk-heading-l">Sorry, there is a problem with the service</h1>')
    })

    it('Should fail payload validation if NGR is empty string', async () => {
      const sessionData = getSessionData()
      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      sessionData['create-a-report'].locationGridRef = ''

      const response = await submitPostRequest(options, 500, sessionData)
      expect(response.payload).toContain('<h1 class="govuk-heading-l">Sorry, there is a problem with the service</h1>')
    })

    it('Should fail payload validation if NGR passes validation but generates invalid lat/lng', async () => {
      const sessionData = getSessionData()
      const options = {
        url,
        payload: {
          answerId,
          answerDetails
        }
      }

      sessionData['create-a-report'].locationGridRef = 'TT0000000000'

      const response = await submitPostRequest(options, 500, sessionData)
      expect(response.payload).toContain('<h1 class="govuk-heading-l">Sorry, there is a problem with the service</h1>')
    })

    it('Date set to today', async () => {
      const today = new Date(new Date().toDateString())
      sessionData['create-a-report'].dateObserved = 'today'
      sessionData['create-a-report'].dateTimeToday = '00:00'
      sessionData['create-a-report'].descriptionEmailReportDateDay = today.getDate().toString()
      sessionData['create-a-report'].descriptionEmailReportDateMonth = (today.getMonth() + 1).toString()
      sessionData['create-a-report'].descriptionEmailReportDateYear = today.getFullYear().toString()
      sessionData['create-a-report'].descriptionEmailReportTime = '00:00'

      const options = {
        url
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
      sessionData['create-a-report'].dateTimeYesterday = '00:00'
      sessionData['create-a-report'].descriptionEmailReportDateDay = yesterday.getDate().toString()
      sessionData['create-a-report'].descriptionEmailReportDateMonth = (yesterday.getMonth() + 1).toString()
      sessionData['create-a-report'].descriptionEmailReportDateYear = yesterday.getFullYear().toString()
      sessionData['create-a-report'].descriptionEmailReportTime = '00:00'

      // date.setDate(date.getDate() - 1)

      const options = {
        url
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
        url
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
          datetimeObserved: before.toISOString(),
          datetimeReported: before.toISOString()
        })
      }))
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
        url
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

    it('Should redirect to report manager when isMember is true', async () => {
      mockIsMemberOfRMGroup.mockReturnValue(true)
      const sessionData = getSessionData()
      const options = {
        url
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      // Redirect to report manager URL
      expect(response.headers.location).toContain(config.rmUrl)
      // Check that payload contains a session guid (UUID format)
      expect(response.headers.location).toMatch(/[a-f0-9-]{36}/)
    })

    it('Should redirect to report-submitted page when isMember is false', async () => {
      mockIsMemberOfRMGroup.mockReturnValue(false)
      const sessionData = getSessionData()
      const options = {
        url
      }

      const response = await submitPostRequest(options, 302, sessionData)
      expect(response.request.yar.get(constants.redisKeys.REPORT_SUBMITTED)).toEqual(true)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(response.headers.location).toEqual(constants.routes.REPORT_SUBMITTED)
    })
  })
})
