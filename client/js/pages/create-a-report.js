const toggleIncidentTypesButton = document.querySelector('#toggle-incident-types')
const incidentInputs = document.querySelectorAll('input[id^="incidentType"]')
const divider = document.querySelector('.govuk-radios__divider')
const checkboxWaterCompany = document.getElementById('water-company')
const checkboxOtherOrg = document.getElementById('other-org')
const waterCompanyRadios = document.getElementById('waterCompanyRadios')
const organisationInput = document.getElementById('organisationInput')
const timeInput = document.getElementById('timeInput')
const otherDateTimeInput = document.getElementById('otherDateTimeInput')
const todayDateInput = document.getElementById('create-date-observed-choice')
const yesterdayDateInput = document.getElementById('create-date-observed-choice-2')
const otherDateInput = document.getElementById('create-date-observed-choice-3')

// Events
toggleIncidentTypesButton.addEventListener('click', (e) => {
  e.preventDefault()
  toggleIncidentTypes()
})
checkboxWaterCompany.addEventListener('change', () => {
  if (checkboxWaterCompany.checked) checkboxOtherOrg.checked = false
  toggleIncidentTypes()
})
checkboxOtherOrg.addEventListener('change', () => {
  if (checkboxOtherOrg.checked) checkboxWaterCompany.checked = false
  toggleIncidentTypes()
})
todayDateInput.addEventListener('change', () => {
  toggleDate()
})
yesterdayDateInput.addEventListener('change', () => {
  toggleDate()
})
otherDateInput.addEventListener('change', () => {
  toggleDate()
})

// funcs
const toggleIncidentTypes = () => {
  const hideIncidents = toggleIncidentTypesButton.innerText.indexOf('Hide') > -1
  incidentInputs.forEach(input => {
    if (input.id.substring(input.id.indexOf('-') + 1) > 3) {
      input.parentElement.style.display = hideIncidents ? 'none' : ''
    }
  })
  divider.style.display = hideIncidents ? 'none' : ''
  toggleIncidentTypesButton.innerText = toggleIncidentTypesButton.innerText.replace(hideIncidents ? 'Hide' : 'Show', hideIncidents ? 'Show' : 'Hide')
}

const toggleWaterAndOrg = () => {
  if (checkboxWaterCompany.checked) {
    waterCompanyRadios.style.display = 'block'
    organisationInput.style.display = 'none'
  } else if (checkboxOtherOrg.checked) {
    waterCompanyRadios.style.display = 'none'
    organisationInput.style.display = 'block'
  } else if ((!checkboxWaterCompany.checked) && (!checkboxOtherOrg.checked)) {
    waterCompanyRadios.style.display = 'none'
    organisationInput.style.display = 'none'
  }
}

const toggleDate = () => {
  if (todayDateInput.checked) {
    timeInput.style.display = 'block'
    otherDateTimeInput.style.display = 'none'
  } else if (yesterdayDateInput.checked) {
    timeInput.style.display = 'block'
    otherDateTimeInput.style.display = 'none'
  } else if (otherDateInput.checked) {
    timeInput.style.display = 'none'
    otherDateTimeInput.style.display = 'block'
  }
}

window.addEventListener('load', () => {
  toggleIncidentTypes()
  toggleWaterAndOrg()
  toggleDate()
})
