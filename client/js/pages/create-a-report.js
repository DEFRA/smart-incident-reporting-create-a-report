import accessibleAutocomplete from 'accessible-autocomplete'

const toggleIncidentTypesButton = document.querySelector('#toggle-incident-types')
const incidentInputs = document.querySelectorAll('input[id^="descriptionIncidentType"]')
const divider = document.querySelector('.govuk-radios__divider')
const errorSummaries = document.getElementsByClassName('govuk-error-summary')
const tabPanels = document.getElementsByClassName('govuk-tabs__panel')
const tabListItems = document.getElementsByClassName('govuk-tabs__list-item')

const three = 3
const five = 5

// funcs
const toggleIncidentTypes = () => {
  const hideIncidents = toggleIncidentTypesButton.innerText.indexOf('Hide') > -1
  incidentInputs.forEach(input => {
    if (parseInt(input.id.substring(input.id.indexOf('-') + 1)) > five) {
      input.parentElement.style.display = hideIncidents ? 'none' : ''
    }
  })
  divider.style.display = hideIncidents ? 'none' : ''
  toggleIncidentTypesButton.innerText = toggleIncidentTypesButton.innerText.replace(hideIncidents ? 'Hide' : 'Show', hideIncidents ? 'Show' : 'Hide')
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
})

const selectEl = document.querySelector('#reporterWaterName')
accessibleAutocomplete.enhanceSelectElement({
  selectElement: selectEl,
  autoselect: false,
  defaultValue: '',
  minLength: 2,
  displayMenu: 'overlay'
})
