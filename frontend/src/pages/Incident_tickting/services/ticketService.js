const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1/tickets'

const getToken = () => {
  // Match authService storage: sessionStorage with key 'smartcampus_session_token'
  return sessionStorage.getItem('smartcampus_session_token') || 
         localStorage.getItem('accessToken') || 
         localStorage.getItem('token')
}

const handleResponse = async (response) => {
  const data = await response.json()
  
  if (!response.ok) {
    const error = new Error(data.error || 'API request failed')
    error.status = response.status
    error.details = data.details
    throw error
  }
  
  return data
}

export const ticketService = {
  // Create ticket
  createTicket: async (formData) => {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(formData)
    })
    return handleResponse(response)
  },

  // Get single ticket
  getTicket: async (ticketId) => {
    const response = await fetch(`${API_BASE}/${ticketId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    return handleResponse(response)
  },

  // Get user's tickets
  getMyTickets: async () => {
    const response = await fetch(`${API_BASE}/my/tickets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    return handleResponse(response)
  },

  // Get all tickets (ADMIN only)
  getAllTickets: async () => {
    const response = await fetch(API_BASE, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    return handleResponse(response)
  },

  // Update ticket status
  updateTicketStatus: async (ticketId, status, notes) => {
    const response = await fetch(`${API_BASE}/${ticketId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ status, notes })
    })
    return handleResponse(response)
  },

  // Assign ticket
  assignTicket: async (ticketId, userId) => {
    const response = await fetch(`${API_BASE}/${ticketId}/assign?assignToUserId=${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    return handleResponse(response)
  },

  // Add comment
  addComment: async (ticketId, content) => {
    const response = await fetch(`${API_BASE}/${ticketId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ content })
    })
    return handleResponse(response)
  },

  // Update comment
  updateComment: async (ticketId, commentId, content) => {
    const response = await fetch(`${API_BASE}/${ticketId}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ content })
    })
    return handleResponse(response)
  },

  // Delete comment
  deleteComment: async (ticketId, commentId) => {
    const response = await fetch(`${API_BASE}/${ticketId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    })
    
    if (!response.ok) {
      const data = await response.json()
      const error = new Error(data.error || 'Failed to delete comment')
      error.status = response.status
      throw error
    }
    
    return null
  }
}
