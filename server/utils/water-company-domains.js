import Fuse from 'fuse.js'

/**
 * Water company email validation module.
 *
 * The isWaterCompanyEmail() function performs a 4-layer validation strategy to identify
 * water company emails and redirect users to the check-reporter-type page:
 *
 * 1. Exact match: Checks against the list of valid water company domains.
 * 2. Known misspellings: Checks against an explicit allow-list of common mistyped domains.
 * 3. TLD correction: Detects if a user mistakenly used .com instead of .co.uk
 *    (e.g. 'wessexwater.com' → 'wessexwater.co.uk').
 * 4. Fuzzy fallback: Uses Fuse.js for close typo detection, but only when the domain
 *    name label (first part before the dot) exceeds 4 characters to avoid false positives
 *    on short/generic domains (e.g. 'test.co.uk').
 *
 * The fuzzy matching threshold is tight (0.2) to minimize false positives while still
 * catching legitimate spelling mistakes.
 */

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

/**
 * Known mistyped/misspelled water company domains that should still be
 * identified as water company emails and redirect to check-reporter-type
 */
const mistypedWaterCompanyDomains = [
  'affinity.co.uk',
  'angilanwater.co.uk',
  'anglainwater.co.uk',
  'anglian.co.uk',
  'anglianwaters.co.uk',
  'anglianwter.co.uk',
  'anglianwater.com',
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

const exactDomainSet = new Set(waterCompanyDomains)
const mistypedDomainSet = new Set(mistypedWaterCompanyDomains.map(d => d.toLowerCase()))
const FUZZY_MATCH_THRESHOLD = 0.2

const domainMatcher = new Fuse(waterCompanyDomains, {
  includeScore: true,
  threshold: FUZZY_MATCH_THRESHOLD,
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

/**
 * Returns the first label of a domain (the part before the first dot).
 * e.g. 'test.co.uk' -> 'test', 'anglianwater.co.uk' -> 'anglianwater'
 */
const getDomainNameLabel = (domain) => {
  const dotIndex = domain.indexOf('.')
  return dotIndex === -1 ? domain : domain.slice(0, dotIndex)
}

export const isWaterCompanyEmail = (email) => {
  if (typeof email !== 'string') {
    return false
  }

  const domain = getEmailDomain(email.toLowerCase().trim())

  if (!domain) {
    return false
  }

  // 1. Exact match against valid water company domains
  if (exactDomainSet.has(domain)) {
    return true
  }

  // 2. Exact match against known mistyped water company domains
  if (mistypedDomainSet.has(domain)) {
    return true
  }

  // 3. Check if domain mistakenly uses .com instead of .co.uk
  if (domain.endsWith('.com')) {
    const coUkVariant = domain.slice(0, -4) + '.co.uk'
    if (exactDomainSet.has(coUkVariant)) {
      return true
    }
  }

  // 4. Fuzzy match — only applied when the domain name label exceeds 4 characters
  const nameLabel = getDomainNameLabel(domain)
  if (nameLabel.length <= 4) {
    return false
  }

  const matches = domainMatcher.search(domain)
  return matches.length > 0 && matches[0].score <= FUZZY_MATCH_THRESHOLD
}

export default {
  isWaterCompanyEmail
}
