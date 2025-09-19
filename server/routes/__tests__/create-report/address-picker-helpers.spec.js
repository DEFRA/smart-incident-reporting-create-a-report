import helpers from '../../create-report/address-picker-helpers.js'

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

  // describe('findAddresses', async () => {
  //   it('', () => {
  //   })
  // })
})
