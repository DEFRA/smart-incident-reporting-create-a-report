import accessibleAutocomplete from 'accessible-autocomplete'

const initAutocomplete = () => {
  const selectElement = document.querySelector('#reporterWaterName')
  const existingAutocomplete = document.querySelector('.autocomplete__wrapper')

  if (!selectElement || existingAutocomplete) {
    return
  }

  accessibleAutocomplete.enhanceSelectElement({
    selectElement,
    autoselect: false,
    defaultValue: '',
    minLength: 2,
    displayMenu: 'overlay'
  })
}

const onReporterTypeChange = (event) => {
  if (event.target.value !== 'water') {
    return
  }

  initAutocomplete()
}

const init = () => {
  initAutocomplete()

  const radioButtons = document.querySelectorAll('input[name="reporterType"]')
  radioButtons.forEach((radioButton) => {
    radioButton.addEventListener('change', onReporterTypeChange)
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
