const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:8081/api'
const API_BASE_URL = API_ROOT.endsWith('/v1/tickets')
  ? API_ROOT
  : `${API_ROOT.replace(/\/+$/, '')}/v1/tickets`

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
  const data = await response.json()
  
  if (!response.ok) {
    const error = new Error(data.message || `HTTP ${response.status}`)
    error.status = response.status
    error.details = data.details || {}
    throw error
  }
  
  return data
}

// Create ticket
export const createTicket = async (ticketData) => {
  const response = await fetch(`${API_BASE_URL}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(ticketData)
  })
  return handleResponse(response)
}

// Get ticket by ID
export const getTicket = async (ticketId) => {
  const response = await fetch(`${API_BASE_URL}/${ticketId}`, {
    method: 'GET',
    headers: getHeaders()
  })
  return handleResponse(response)
}

// Get my tickets
export const getMyTickets = async () => {
  const response = await fetch(`${API_BASE_URL}/my/tickets`, {
    method: 'GET',
    headers: getHeaders()
  })
  return handleResponse(response)
}

// Get all tickets (admin)
export const getAllTickets = async () => {
  const response = await fetch(`${API_BASE_URL}`, {
    method: 'GET',
    headers: getHeaders()
  })
  return handleResponse(response)
}

// Get assigned tickets (technician)
export const getAssignedTickets = async () => {
  const response = await fetch(`${API_BASE_URL}/assigned`, {
    method: 'GET',
    headers: getHeaders()
  })
  return handleResponse(response)
}

// Update ticket status
export const updateTicketStatus = async (ticketId, statusData) => {
  const response = await fetch(`${API_BASE_URL}/${ticketId}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(statusData)
  })
  return handleResponse(response)
}

// Assign ticket
export const assignTicket = async (ticketId, assignToUserId) => {
  const response = await fetch(`${API_BASE_URL}/${ticketId}/assign?assignToUserId=${assignToUserId}`, {
    method: 'POST',
    headers: getHeaders()
  })
  return handleResponse(response)
}

// Upload attachments
export const uploadAttachments = async (ticketId, attachmentUrls) => {
  const response = await fetch(`${API_BASE_URL}/${ticketId}/attachments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ attachmentUrls })
  })
  return handleResponse(response)
}

// Add comment
export const addComment = async (ticketId, commentData) => {
  const response = await fetch(`${API_BASE_URL}/${ticketId}/comments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(commentData)
  })
  return handleResponse(response)
}

// Update comment
export const updateComment = async (ticketId, commentId, commentData) => {
  const response = await fetch(`${API_BASE_URL}/${ticketId}/comments/${commentId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(commentData)
  })
  return handleResponse(response)
}

// Delete comment
export const deleteComment = async (ticketId, commentId) => {
  const response = await fetch(`${API_BASE_URL}/${ticketId}/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getHeaders()
  })
  
  if (!response.ok) {
    try {
      const data = await response.json()
      const error = new Error(data.message || `HTTP ${response.status}`)
      error.status = response.status
      throw error
    } catch (err) {
      if (err.message && !err.message.startsWith('HTTP')) {
        throw err
      }
      const error = new Error(`HTTP ${response.status}`)
      error.status = response.status
      throw error
    }
  }
  
  return null
}

// Export all as object for easy import
const ticketApiService = {
  createTicket,
  getTicket,
  getMyTickets,
  getAllTickets,
  getAssignedTickets,
  updateTicketStatus,
  assignTicket,
  uploadAttachments,
  addComment,
  updateComment,
  deleteComment
}

export default ticketApiService
