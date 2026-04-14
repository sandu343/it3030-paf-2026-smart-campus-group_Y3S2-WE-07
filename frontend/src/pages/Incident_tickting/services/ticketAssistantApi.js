const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1/tickets'

const getHeaders = () => {
  // Match authService storage: sessionStorage with key 'smartcampus_session_token'
  const token = sessionStorage.getItem('smartcampus_session_token') ||
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token')

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

const handleResponse = async (response) => {
  let data = null
  try {
    data = await response.json()
  } catch (_) {
    data = null
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      response.statusText ||
      `HTTP ${response.status}`

    const error = new Error(message)
    error.status = response.status
    error.details = data?.details || {}
    throw error
  }

  return data || {}
}

export const askTicketAssistant = async (message) => {
  const response = await fetch(`${API_BASE_URL}/assistant`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message })
  })

  return handleResponse(response)
}

const ticketAssistantApi = {
  askTicketAssistant
}

export default ticketAssistantApi
