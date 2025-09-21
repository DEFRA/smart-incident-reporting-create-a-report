import helpers from '../address-picker-helpers.js'
import findLocation from '../../services/find-location.js'

jest.mock('../../services/find-location', () => ({
  findByPostcode: jest.fn()
}))

const chooseAddress = 'choose-address'
const postcodeDetails = 'postcode-details'

const sessionDataMock = {
  [chooseAddress]: () => ({
    resultsFound: true,
    buildingDetails: '100',
    postcodeDetails: 'SG14 3LB',
    showFullResults: true,
    resultsData: [
      {
        uprn: '1',
        postcodeDetails: 'SG14 3LB',
        address: '9, Watermill Lane, Hertford, SG14 3LB',
        x: 100001,
        y: 100001
      },
      {
        uprn: '2',
        postcodeDetails: 'SG14 3LB',
        address: '10, Watermill Lane, Hertford, SG14 3LB',
        x: 100002,
        y: 100002
      }
    ],
    resultlength: 2,
    addressItemsForView: [
      {
        value: '1',
        text: '9, Watermill Lane, Hertford, SG14 3LB'
      },
      {
        value: '2',
        text: '10, Watermill Lane, Hertford, SG14 3LB'
      }
    ]
  }),
  [postcodeDetails]: () => ({
    header: {
      uri: 'http://test.test',
      query: 'postcode=SG14 3LB',
      totalresults: 2
    },
    results: [
      {
        DPA: {
          UPRN: '1',
          ADDRESS: '9, WATERMILL LANE, HERTFORD, SG14 3LB',
          POSTCODE: 'SG14 3LB',
          X_COORDINATE: 100001,
          Y_COORDINATE: 100001
        }
      },
      {
        DPA: {
          UPRN: '2',
          ADDRESS: '10, WATERMILL LANE, HERTFORD, SG14 3LB',
          POSTCODE: 'SG14 3LB',
          X_COORDINATE: 100002,
          Y_COORDINATE: 100002
        }
      }
    ]
  })
}

describe('address-picker-helpers', () => {
  describe('formatAddress', () => {
    it('Formats normal address', () => {
      const result = helpers.formatAddress('10, Watermill Lane, Hertford, SG14 3LB')
      expect(result.addressLine1).toEqual('10, Watermill Lane')
      expect(result.townOrCity).toEqual('Hertford')
      expect(result.postcode).toEqual('SG14 3LB')
    })

    it('Formats longer address', () => {
      const result = helpers.formatAddress('Spongeland, 10, Watermill Lane, Hertford, SG14 3LB')
      expect(result.addressLine1).toEqual('Spongeland, 10, Watermill Lane')
      expect(result.townOrCity).toEqual('Hertford')
      expect(result.postcode).toEqual('SG14 3LB')
    })
  })

  describe('findAddresses', () => {
    it('Previously calculated result is cached, so use that', async () => {
      const addressData = sessionDataMock[chooseAddress]()
      const sessionData = {
        [chooseAddress]: addressData
      }
      const session = {
        get: (key) => {
          return sessionData[key]
        }
      }

      const result = await helpers.findAddresses(session, '100', 'SG14 3LB')
      expect(result).toEqual(addressData)
    })

    it('Postcode result is cached by building number isn\'t so reuse postcode data', async () => {
      const postcodeData = sessionDataMock[postcodeDetails]()
      const addressData = sessionDataMock[chooseAddress]()
      const sessionData = {
        [chooseAddress]: addressData,
        [postcodeDetails]: postcodeData
      }
      const session = {
        get: (key) => {
          return sessionData[key]
        },
        set: (key, value) => {
          sessionData[key] = value
        }
      }

      const result = await helpers.findAddresses(session, '101', 'SG14 3LB')
      addressData.buildingDetails = '101'
      expect(result).toEqual(addressData)
    })

    it('No results in cached or API data, so return false to results found', async () => {
      const addressData = sessionDataMock[chooseAddress]()
      const postcodeData = sessionDataMock[postcodeDetails]()
      postcodeData.header.totalresults = 0

      const sessionData = {
        [chooseAddress]: addressData,
        [postcodeDetails]: postcodeData
      }

      const session = {
        get: (key) => {
          return sessionData[key]
        }
      }

      const result = await helpers.findAddresses(session, '101', 'SG14 3LB')
      expect(result.resultsFound).toBe(false)
    })

    it('No cached results, call OS API', async () => {
      const sessionData = {}
      const session = {
        get: (key) => {
          return sessionData[key]
        },
        set: (key, value) => {
          sessionData[key] = value
        }
      }

      const postcodeData = sessionDataMock[postcodeDetails]()
      findLocation.findByPostcode.mockResolvedValueOnce({ payload: postcodeData })

      const addressData = sessionDataMock[chooseAddress]()
      const result = await helpers.findAddresses(session, '100', 'SG14 3LB')
      expect(result).toEqual(addressData)
    })
  })
})
