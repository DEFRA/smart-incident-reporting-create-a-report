import Fuse from 'fuse.js'

/**
 * List of valid water company email domains
 */
const waterCompanyDomains = [
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

const exactDomainSet = new Set(waterCompanyDomains)

const domainMatcher = new Fuse(waterCompanyDomains, {
  includeScore: true,
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 5
})

const getEmailDomain = (email) => {
  const atIndex = email.lastIndexOf('@')

  if (atIndex <= 0 || atIndex >= email.length - 1) {
    return ''
  }

  return email.slice(atIndex + 1)
}

export const isWaterCompanyEmail = (email) => {
  if (typeof email !== 'string') {
    return false
  }

  const domain = getEmailDomain(email.toLowerCase().trim())

  if (exactDomainSet.has(domain)) {
    return true
  }

  const matches = domainMatcher.search(domain)
  return matches.length > 0 && matches[0].score <= 0.4
}

export default {
  isWaterCompanyEmail
}
