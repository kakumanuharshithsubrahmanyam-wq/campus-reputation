/** Map API/network errors to user-safe messages (no stack traces). */
export function formatApiError(error, httpStatus) {
  if (error?.message === 'Connecting to Campus Reputation…') {
    return error.message
  }
  if (error?.name === 'TypeError' && String(error.message).includes('fetch')) {
    return 'Unable to reach Campus Reputation right now. Please retry in a moment.'
  }
  if (httpStatus === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  if (httpStatus === 503) {
    return 'Campus services are temporarily unavailable.'
  }
  if (httpStatus === 401) {
    return 'Session expired. Sign in again with your wallet.'
  }
  if (httpStatus === 403) {
    return 'You do not have permission to perform this action.'
  }
  if (httpStatus === 404) {
    return error?.message || 'Record not found.'
  }

  const code = error?.code
  switch (code) {
    case 'INVALID_SIGNATURE':
    case 'UNAUTHORIZED':
      return 'Authentication failed. Sign in again with MetaMask.'
    case 'FORBIDDEN':
      return 'This action is not allowed for your wallet.'
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.'
    case 'NOT_FOUND':
      return 'No matching record was found.'
    case 'INTERNAL_ERROR':
      return 'Something went wrong on the server. Try again later.'
    default:
      break
  }

  return error?.message || 'Request failed. Please try again.'
}
