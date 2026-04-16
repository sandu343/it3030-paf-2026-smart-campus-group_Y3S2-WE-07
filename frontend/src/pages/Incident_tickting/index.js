/**
 * Incident Ticketing Feature - Index File
 * 
 * Exports all components, pages, services, and utilities
 * for the incident ticketing module
 */

// Pages
export { default as IncidentTicketingPage } from './IncidentTicketingPage'
export { default as TicketListPage } from './pages/TicketListPage'
export { default as CreateTicketPage } from './pages/CreateTicketPage'
export { default as TicketDetailsPage } from './pages/TicketDetailsPage'
export { default as CreateTicketForm } from './pages/CreateTicketForm'

// Components
export { default as TicketCard } from './components/TicketCard'
export { default as TicketTable } from './components/TicketTable'
export { StatusBadge, PriorityBadge } from './components/StatusBadge'
export { default as AttachmentUploader } from './components/AttachmentUploader'
export { default as AttachmentPreviewList } from './components/AttachmentPreviewList'
export { default as CommentThread } from './components/CommentThread'
export { default as CommentForm } from './components/CommentForm'
export { default as EditCommentForm } from './components/EditCommentForm'
export { ErrorAlert, SuccessAlert, InfoAlert } from './components/ErrorAlert'
export { default as LoadingSpinner } from './components/LoadingSpinner'
export { default as TicketAssistantWidget } from './components/TicketAssistantWidget'

// Services
export { default as ticketApiService } from './services/ticketApiService'
export { default as ticketAssistantApi } from './services/ticketAssistantApi'

// Utils
export {
  VALIDATION_RULES,
  validateTicketForm,
  validateAttachments,
  validateComment
} from './utils/validationUtils'

export {
  formatDate,
  formatDateTime,
  formatTimeAgo,
  truncateText
} from './utils/formatUtils'
