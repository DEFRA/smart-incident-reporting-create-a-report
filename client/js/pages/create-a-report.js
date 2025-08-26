import accessibleAutocomplete from 'accessible-autocomplete'

const toggleIncidentTypesButton = document.querySelector('#toggle-incident-types')
const incidentInputs = document.querySelectorAll('input[id^="descriptionIncidentType"]')
const divider = document.querySelector('.govuk-radios__divider')
const timeInput = document.getElementById('timeInput')
const otherDateTimeInput = document.getElementById('otherDateTimeInput')
const nowDateInput = document.getElementById('dateObserved')
const todayDateInput = document.getElementById('dateObserved-2')
const yesterdayDateInput = document.getElementById('dateObserved-3')
const otherDateInput = document.getElementById('dateObserved-4')
const errorSummaries = document.getElementsByClassName('govuk-error-summary')
const tabPanels = document.getElementsByClassName('govuk-tabs__panel')
const tabListItems = document.getElementsByClassName('govuk-tabs__list-item')

const findAddressButton = document.getElementById('change-search')

const addressSearchResults = document.getElementById('address-search-results')

const locationOfIncident = document.getElementById('location-of-incident')
const chooseAddress = document.getElementById('choose-address')
const useGridRef = document.getElementById('use-grid-ref')
const changeSearch = document.getElementById('change-search')
const findDifferentAddress = document.getElementById('find-different-address')

const addressInput = document.getElementById('address-input')
const selectedAddress = document.getElementById('selected-address')

const three = 3

// Events
toggleIncidentTypesButton.addEventListener('click', (e) => {
  e.preventDefault()
  toggleIncidentTypes()
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

/* findAddressButton.addEventListener('click', (e) => {
  console.log('Button is clicked')
  // getAddresses()
  locationOfIncident.style.display = 'none'
  addressSearchResults.style.display = 'block'
}) */

useGridRef.addEventListener('click', (e) => {
  console.log('grid ref is clicked')
  document.getElementById('locationOfIncident').checked = true
  const ngrRadio = document.getElementById('conditional-locationOfIncident')
  const addressRadio = document.getElementById('conditional-locationOfIncident-2')
  addressRadio.classList.add('govuk-radios__conditional--hidden')
  ngrRadio.classList.remove('govuk-radios__conditional--hidden')
  document.getElementById('buildingDetails').value = ''
  document.getElementById('postcodeDetails').value = ''
  selectedAddress.classList.add('hidden')
  locationOfIncident.classList.remove('hidden')
  chooseAddress.classList.add('hidden')
})

changeSearch.addEventListener('click', (e) => {
  console.log('change is clicked')
  locationOfIncident.classList.remove('hidden')
  chooseAddress.classList.add('hidden')
  selectedAddress.classList.add('hidden')
})

findDifferentAddress.addEventListener('click', (e) => {
  console.log('findDifferent address is clicked')
  selectedAddress.classList.add('hidden')
  document.getElementById('buildingDetails').value = ''
  document.getElementById('postcodeDetails').value = ''
  addressInput.classList.remove('hidden')
})
/* async function getAddresses() {
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
} */

// funcs
const toggleIncidentTypes = () => {
  const hideIncidents = toggleIncidentTypesButton.innerText.indexOf('Hide') > -1
  incidentInputs.forEach(input => {
    if (input.id.substring(input.id.indexOf('-') + 1) > 5) {
      input.parentElement.style.display = hideIncidents ? 'none' : ''
    }
  })
  divider.style.display = hideIncidents ? 'none' : ''
  toggleIncidentTypesButton.innerText = toggleIncidentTypesButton.innerText.replace(hideIncidents ? 'Hide' : 'Show', hideIncidents ? 'Show' : 'Hide')
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

let selectEl = document.querySelector('#reporterWaterName')
accessibleAutocomplete.enhanceSelectElement({
  selectElement: selectEl,
  autoselect: false,
  defaultValue: '',
  minLength: 2,
  displayMenu: 'overlay'
})
