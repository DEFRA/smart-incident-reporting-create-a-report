const toggleIncidentTypesButton = document.querySelector('#toggle-incident-types')
const incidentInputs = document.querySelectorAll('input[id^="descriptionIncidentType"]')
const divider = document.querySelector('.govuk-radios__divider')
const radioPublic = document.getElementById('public')
const radioWaterCompany = document.getElementById('water')
const radioOtherOrg = document.getElementById('other')
const waterCompanyRadios = document.getElementById('waterCompanyRadios')
const organisationInput = document.getElementById('organisationInput')
const timeInput = document.getElementById('timeInput')
const otherDateTimeInput = document.getElementById('otherDateTimeInput')
const nowDateInput = document.getElementById('dateObserved')
const todayDateInput = document.getElementById('dateObserved-2')
const yesterdayDateInput = document.getElementById('dateObserved-3')
const otherDateInput = document.getElementById('dateObserved-4')
const errorSummaries = document.getElementsByClassName('govuk-error-summary')
const tabPanels = document.getElementsByClassName('govuk-tabs__panel')
const tabListItems = document.getElementsByClassName('govuk-tabs__list-item')

const findAddressButton = document.getElementById('find-address')
const locationOfIncident = document.getElementById('location-of-incident')
const addressSearchResults = document.getElementById('address-search-results')
const useGridRef = document.getElementById('use-grid-ref')
const changeSearch = document.getElementById('change-search')

const three = 3

// Events
toggleIncidentTypesButton.addEventListener('click', (e) => {
  e.preventDefault()
  toggleIncidentTypes()
})
radioPublic.addEventListener('change', () => {
  if (radioPublic.checked) {
    radioWaterCompany.checked = false
    radioOtherOrg.checked = false
  }
  toggleWaterAndOrg()
})
radioWaterCompany.addEventListener('change', () => {
  if (radioWaterCompany.checked) {
    radioOtherOrg.checked = false
  }
  toggleWaterAndOrg()
})
radioOtherOrg.addEventListener('change', () => {
  if (radioOtherOrg.checked) {
    radioWaterCompany.checked = false
  }
  toggleWaterAndOrg()
})
nowDateInput.addEventListener('change', () => {
  toggleDate()
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

findAddressButton.addEventListener('click', (e) => {
  console.log('Button is clicked')
  // getAddresses()
  locationOfIncident.style.display = 'none'
  addressSearchResults.style.display = 'block'
})

useGridRef.addEventListener('click', (e) => {
  console.log('grid ref is clicked')
  locationOfIncident.style.display = 'block'
  addressSearchResults.style.display = 'none'
})

changeSearch.addEventListener('click', (e) => {
  console.log('change is clicked')
  locationOfIncident.style.display = 'block'
  addressSearchResults.style.display = 'none'
})

async function getAddresses() {
  const buildingDetails = document.getElementById('buildingDetails').value
  const postcode = document.getElementById('postcode').value
  console.log('Data for buildingDetails', buildingDetails)
  console.log('Data for postcode', postcode)
  const response = await fetch('/get-addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buildingDetails, postcode })
  })
  const data = await response.json()
  console.log('Data for JSON response', data)
}

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
  if (radioPublic.checked) {
    waterCompanyRadios.style.display = 'none'
    organisationInput.style.display = 'none'
  } else if (radioWaterCompany.checked) {
    waterCompanyRadios.style.display = 'block'
    organisationInput.style.display = 'none'
  } else if (radioOtherOrg.checked) {
    waterCompanyRadios.style.display = 'none'
    organisationInput.style.display = 'block'
  } else if ((!radioWaterCompany.checked) && (!radioOtherOrg.checked)) {
    waterCompanyRadios.style.display = 'none'
    organisationInput.style.display = 'none'
  } else {
    // do nothing
  }
}

const toggleDate = () => {
  if (nowDateInput.checked) {
    timeInput.style.display = 'none'
    otherDateTimeInput.style.display = 'none'
  } else if (todayDateInput.checked) {
    timeInput.style.display = 'block'
    otherDateTimeInput.style.display = 'none'
  } else if (yesterdayDateInput.checked) {
    timeInput.style.display = 'block'
    otherDateTimeInput.style.display = 'none'
  } else if (otherDateInput.checked) {
    timeInput.style.display = 'none'
    otherDateTimeInput.style.display = 'block'
  } else {
    // do nothing
  }
}

const showFirstErrorTab = () => {
  if (errorSummaries.length > 0) {
    const firstError = errorSummaries[0]
    for (let i = 0; i < tabPanels.length; i++) {
      if (tabPanels[i] === firstError.parentNode.parentNode.parentNode) {
        tabListItems[i].children[0].click()
        break
      }
    }
  }
}

const showIncidentTypes = () => {
  let show = false
  incidentInputs.forEach(input => {
    if (parseInt(input.id.substring(input.id.indexOf('-') + 1)) > three && input.checked) {
      show = true
    }
  })
  return show
}

window.addEventListener('load', () => {
  showFirstErrorTab()
  if (!showIncidentTypes()) {
    toggleIncidentTypes()
  }
  toggleWaterAndOrg()
  toggleDate()
})
