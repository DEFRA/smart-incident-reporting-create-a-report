// This is a location for storing helpers that are used by front end nunjucks templates

const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const findErrorMessageById = (errorSummary, id) => {
  return errorSummary?.errorList?.find((error) => error.href === `#${id}`)
}

const fieldErrorClasses = (errorSummary, id, defaultClass = '') => {
  const hasError = findErrorMessageById(errorSummary, id)
  return defaultClass + (hasError ? ' govuk-input--error' : '')
}

const monthName = (month) => {
  return monthNames[Number(month)]
}

export {
  findErrorMessageById,
  fieldErrorClasses,
  monthName
}
