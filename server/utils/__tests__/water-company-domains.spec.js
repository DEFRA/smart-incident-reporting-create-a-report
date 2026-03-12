import { isWaterCompanyEmail } from '../water-company-domains.js'

const actualWaterCompanyDomains = [
  'affinitywater.co.uk',
  'albionwater.co.uk',
  'anglianwater.co.uk',
  'bournemouthwater.co.uk',
  'bristolwater.co.uk',
  'bwbsl.co.uk',
  'cambridge-water.co.uk',
  'hdcymru.co.uk',
  'dwrcymru.com',
  'eswater.co.uk',
  'hartlepoolwater.co.uk',
  'nwl.co.uk',
  'nwl.euw2.purecloud',
  'portsmouthwater.co.uk',
  'seswater.co.uk',
  'severntrent.co.uk',
  'st.co.uk',
  'southeastwater.co.uk',
  'southernwater.co.uk',
  'south-staffs-water.co.uk',
  'southwestwater.co.uk',
  'thameswater.co.uk',
  'uuplc.co.uk',
  'veolia.co.uk',
  'wessexwater.co.uk',
  'yw.co.uk',
  'yorkshirewater.co.uk'
]

const mistypedWaterCompanyDomains = [
  'affinity.co.uk',
  'angilanwater.co.uk',
  'anglainwater.co.uk',
  'anglian.co.uk',
  'anglianwaters.co.uk',
  'anglianwter.co.uk',
  'ANGLIANWATER.COM',
  'nwo.co.uk',
  'nwul.co.uk',
  '7trent.co.uk',
  '7trent.gov.uk',
  'serverntrent.co.uk',
  'severtrent.co.uk',
  'seventrent.co.uk',
  'severn.co.uk',
  'severnt.co.uk',
  'severntent.co.uk',
  'severntent.com',
  'severntrentwaters.co.uk',
  'severntrnet.co.uk',
  'severnttrent.co.uk',
  'sevthertrent.co.uk',
  'soouthwestwater.co.uk',
  'southerenwater.co.uk',
  'sothernwater.co.uk',
  'southernwater.com.uk',
  'southwest.co.uk',
  'soutwestwater.co.uk',
  'uupl.co.uk',
  'uuplc.uk',
  'uplco.uk',
  'uu.co.uk',
  'uupcl.co.uk',
  'uupk.co.uk',
  'uupl.co.uk',
  'uuplac.co.uk',
  'uuplc.co',
  'uuplc.gov.uk',
  'uutlc.co.uk',
  'uulplc.co.uk',
  'wesseswater.co.uk',
  'wessex.co.uk',
  'wessexswater.co.uk',
  'wessexwater.co.uyk'
]

describe('isWaterCompanyEmail', () => {
  it('Should return true for list of actual water company domains', () => {
    actualWaterCompanyDomains.forEach(domain => {
      expect(isWaterCompanyEmail(`person@${domain}`)).toBe(true)
    })
  })

  it('Should return true for list of mistyped water company domains', () => {
    mistypedWaterCompanyDomains.forEach(domain => {
      expect(isWaterCompanyEmail(`person@${domain}`)).toBe(true)
    })
  })

  it('Should return false for unrelated domains and invalid emails', () => {
    expect(isWaterCompanyEmail('someone@example.com')).toBe(false)
    expect(isWaterCompanyEmail('not-an-email')).toBe(false)
    expect(isWaterCompanyEmail('someone@com')).toBe(false)
  })
})
