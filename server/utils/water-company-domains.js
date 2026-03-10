/**
 * List of valid water company email domains
 */
const waterCompanyDomains = [
  '@affinitywater.co.uk',
  '@albionwater.co.uk',
  '@anglianwater.co.uk',
  '@bournemouthwater.co.uk',
  '@bristolwater.co.uk',
  '@bwbsl.co.uk',
  '@cambridge-water.co.uk',
  '@hdcymru.co.uk',
  '@dwrcymru.com',
  '@eswater.co.uk',
  '@hartlepoolwater.co.uk',
  '@nwl.co.uk',
  '@nwl.euw2.purecloud',
  '@portsmouthwater.co.uk',
  '@seswater.co.uk',
  '@severntrent.co.uk',
  '@st.co.uk',
  '@southeastwater.co.uk',
  '@southernwater.co.uk',
  '@south-staffs-water.co.uk',
  '@southwestwater.co.uk',
  '@thameswater.co.uk',
  '@uuplc.co.uk',
  '@veolia.co.uk',
  '@wessexwater.co.uk',
  '@yw.co.uk',
  '@yorkshirewater.co.uk'
]

export const isWaterCompanyEmail = (email) => {
  const normalizedEmail = email.toLowerCase().trim()
  return waterCompanyDomains.some(domain => normalizedEmail.endsWith(domain))
}

export default {
  isWaterCompanyEmail
}
