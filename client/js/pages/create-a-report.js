const toggleIncidentTypesButton = document.querySelector('#toggle-incident-types')
const incidentInputs = document.querySelectorAll('input[id^="descriptionIncidentType"]')
const divider = document.querySelector('.govuk-radios__divider')
const checkboxWaterCompany = document.getElementById('water')
const checkboxOtherOrg = document.getElementById('other')
const waterCompanyRadios = document.getElementById('waterCompanyRadios')
const organisationInput = document.getElementById('organisationInput')
const timeInput = document.getElementById('timeInput')
const otherDateTimeInput = document.getElementById('otherDateTimeInput')
const todayDateInput = document.getElementById('dateObserved')
const yesterdayDateInput = document.getElementById('dateObserved-2')
const otherDateInput = document.getElementById('dateObserved-3')
const errorSummaries = document.getElementsByClassName('govuk-error-summary')
const tabPanels = document.getElementsByClassName('govuk-tabs__panel')
const tabListItems = document.getElementsByClassName('govuk-tabs__list-item')
const three = 3

// Events
toggleIncidentTypesButton.addEventListener('click', (e) => {
  e.preventDefault()
  toggleIncidentTypes()
})
checkboxWaterCompany.addEventListener('change', () => {
  if (checkboxWaterCompany.checked) {
    checkboxOtherOrg.checked = false
  }
  toggleWaterAndOrg()
})
checkboxOtherOrg.addEventListener('change', () => {
  if (checkboxOtherOrg.checked) {
    checkboxWaterCompany.checked = false
  }
  toggleWaterAndOrg()
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
  } else {
    // do nothing
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
