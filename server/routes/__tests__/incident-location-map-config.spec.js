import constants from '../../utils/constants.js'
import { incidentLocationMapConfig } from '../check-and-submit-report.js'

const url = constants.routes.CHECK_AND_SUBMIT_REPORT

describe(url, () => {
  describe('incidentLocationMapConfig', () => {
    it('Should return undefined when reportPayload is undefined', () => {
      const request = { yar: { get: jest.fn() } }

      expect(incidentLocationMapConfig(request, undefined)).toBeUndefined()
    })

    it('Should return map config for gridReference payload', () => {
      const request = { yar: { get: jest.fn() } }
      const reportPayload = {
        locationOfIncident: 'gridReference',
        locationGridRef: 'SJ 67084 44110'
      }

      expect(incidentLocationMapConfig(request, reportPayload)).toEqual({
        point: [367084, 344110],
        disableControls: true,
        zoom: 10
      })
    })

    it('Should return undefined when gridReference payload has no locationGridRef', () => {
      const request = { yar: { get: jest.fn() } }
      const reportPayload = {
        locationOfIncident: 'gridReference'
      }

      expect(incidentLocationMapConfig(request, reportPayload)).toBeUndefined()
    })

    it('Should return map config for address payload when selected address has coordinates', () => {
      const request = {
        yar: {
          get: jest.fn().mockReturnValue([{ x: 100001, y: 100001 }])
        }
      }
      const reportPayload = {
        locationOfIncident: 'address'
      }

      expect(incidentLocationMapConfig(request, reportPayload)).toEqual({
        point: [100001, 100001],
        disableControls: true,
        zoom: 10
      })
    })

    it('Should return undefined for address payload when selected address has no coordinates', () => {
      const request = {
        yar: {
          get: jest.fn().mockReturnValue([])
        }
      }
      const reportPayload = {
        locationOfIncident: 'address'
      }

      expect(incidentLocationMapConfig(request, reportPayload)).toBeUndefined()
    })

    it('Should return undefined for unsupported locationOfIncident value', () => {
      const request = { yar: { get: jest.fn() } }
      const reportPayload = {
        locationOfIncident: 'unknown'
      }

      expect(incidentLocationMapConfig(request, reportPayload)).toBeUndefined()
    })
  })
})
