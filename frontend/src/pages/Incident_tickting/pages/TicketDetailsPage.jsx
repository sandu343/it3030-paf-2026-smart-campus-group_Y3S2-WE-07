import React, { useState, useEffect } from 'react'
import { ChevronLeft, AlertCircle, Check } from 'lucide-react'
import ticketApiService from '../services/ticketApiService'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge'
import SLABadge from '../components/SLABadge'
import AttachmentPreviewList from '../components/AttachmentPreviewList'
import CommentThread from '../components/CommentThread'
import { ErrorAlert, SuccessAlert } from '../components/ErrorAlert'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDateTime } from '../utils/formatUtils'

export const TicketDetailsPage = ({ ticketId, isAdmin, isTechnician, currentUserId, onBack }) => {
  const [ticket, setTicket] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showStatusForm, setShowStatusForm] = useState(false)
  const [newStatus, setNewStatus] = useState(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchTicket()
  }, [ticketId])

  const fetchTicket = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await ticketApiService.getTicket(ticketId)
      setTicket(data)
      setNewStatus(data.status)
    } catch (err) {
      setError(err.message || 'Failed to load ticket')
    } finally {
      setIsLoading(false)
    }
  }

  const getValidTransitions = (status, role) => {
    const adminTransitions = {
      OPEN: ['IN_PROGRESS', 'REJECTED'],
      IN_PROGRESS: ['RESOLVED', 'REJECTED'],
      RESOLVED: ['CLOSED'],
      CLOSED: [],
      REJECTED: []
    }
    
    const technicianTransitions = {
      OPEN: ['IN_PROGRESS'],
      IN_PROGRESS: ['RESOLVED'],
      RESOLVED: [],
      CLOSED: [],
      REJECTED: []
    }
    
    const transitions = role === 'TECHNICIAN' ? technicianTransitions : adminTransitions
    return transitions[status] || []
  }

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === ticket.status) {
      return
    }

    if (newStatus === 'RESOLVED' && !notes.trim()) {
      setError('Resolution notes are required when marking as RESOLVED')
      return
    }

    if (newStatus === 'REJECTED' && !notes.trim()) {
      setError('Rejection reason is required when marking as REJECTED')
      return
    }

    setIsUpdatingStatus(true)
    setError(null)

    try {
      const statusData = { status: newStatus }
      if (newStatus === 'RESOLVED') {
        statusData.resolutionNotes = notes
      } else if (newStatus === 'REJECTED') {
        statusData.rejectionReason = notes
      }

      await ticketApiService.updateTicketStatus(ticketId, statusData)
      setSuccessMessage('Ticket status updated successfully')
      setShowStatusForm(false)
      setNotes('')
      fetchTicket()

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update ticket status')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (!ticket) {
    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Tickets
        </button>

        <div className="rounded-3xl border border-green-100 bg-white p-12 shadow-sm text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 text-lg">{error || 'Ticket not found'}</p>
        </div>
      </div>
    )
  }

  const validTransitions = getValidTransitions(ticket.status, isTechnician ? 'TECHNICIAN' : 'ADMIN')

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Tickets
      </button>

      {/* Alerts */}
      {successMessage && <SuccessAlert message={successMessage} />}
      {error && <ErrorAlert message={error} />}

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Ticket Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Ticket Header Card */}
          <div className="rounded-3xl border border-green-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-green-900">{ticket.title}</h1>
                <p className="mt-2 text-sm text-slate-600">Ticket ID: {ticket.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={ticket.status} size="lg" />
                <PriorityBadge priority={ticket.priority} size="lg" />
              </div>
            </div>

            <div className="border-t border-green-100 pt-6">
              <p className="whitespace-pre-wrap text-slate-700">{ticket.description}</p>
            </div>
          </div>

          {/* Details Card */}
          <div className="rounded-3xl border border-green-100 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-green-900">Details</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-600">Category</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{ticket.category}</p>
              </div>
              {ticket.resourceId && (
                <div>
                  <p className="text-sm font-semibold text-slate-600">Resource ID</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{ticket.resourceId}</p>
                </div>
              )}
              {ticket.location && (
                <div>
                  <p className="text-sm font-semibold text-slate-600">Location</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{ticket.location}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-600">Preferred Contact</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{ticket.preferredContact}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Reported By</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{ticket.reportedByName}</p>
              </div>
              {ticket.assignedTo && (
                <div>
                  <p className="text-sm font-semibold text-slate-600">Assigned To</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{ticket.assignedToName}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-600">Created</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{formatDateTime(ticket.createdAt)}</p>
              </div>
              {ticket.resolutionNotes && (
                <div className="col-span-full">
                  <p className="text-sm font-semibold text-slate-600">Resolution Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-900">{ticket.resolutionNotes}</p>
                </div>
              )}
              {ticket.rejectionReason && (
                <div className="col-span-full">
                  <p className="text-sm font-semibold text-slate-600">Rejection Reason</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-900">{ticket.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
            <div className="rounded-3xl border border-green-100 bg-white p-8 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-green-900">Attachments</h3>
              <AttachmentPreviewList attachmentUrls={ticket.attachmentUrls} />
            </div>
          )}

          {/* Comments */}
          <div className="rounded-3xl border border-green-100 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-green-900">Comments</h2>
            <CommentThread
              ticketId={ticketId}
              comments={ticket.comments || []}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onCommentAdded={fetchTicket}
            />
          </div>
        </div>

        {/* Right Column - Actions Sidebar */}
        {(isAdmin || isTechnician) && (
          <div className="space-y-6">
            {/* SLA Status Card */}
            {ticket.slaDeadline && (
              <div className="rounded-3xl border border-green-100 bg-white p-8 shadow-sm">
                <h3 className="mb-6 text-lg font-bold text-green-900">SLA Status</h3>
                <div className="space-y-6">
                  <div>
                    <p className="mb-3 text-sm font-semibold text-slate-600">Escalation Level</p>
                    <SLABadge
                      slaDeadline={ticket.slaDeadline}
                      escalationLevel={ticket.escalationLevel}
                      isOverdue={ticket.isOverdue}
                      size="md"
                      showTime={true}
                    />
                  </div>

                  <div className="border-t border-green-100 pt-6">
                    <p className="text-sm font-semibold text-slate-600">SLA Deadline</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatDateTime(ticket.slaDeadline)}
                    </p>
                  </div>

                  {ticket.isOverdue && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm text-red-800">
                        <span className="font-semibold">⚠️ This ticket is overdue</span>
                      </p>
                    </div>
                  )}

                  {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
                    <div className="border-t border-green-100 pt-6">
                      <p className="text-sm font-semibold text-slate-600">Resolved Within SLA</p>
                      <p className={`mt-1 text-sm font-bold ${ticket.resolvedWithinSla ? 'text-green-700' : 'text-red-700'}`}>
                        {ticket.resolvedWithinSla ? '✓ Yes' : '✗ No'}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Admin Actions Card */}
            <div className="sticky top-6 rounded-3xl border border-green-100 bg-white p-8 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-green-900">{isAdmin ? 'Admin' : 'Technician'} Actions</h3>

              {showStatusForm ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Change Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      disabled={isUpdatingStatus}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    >
                      <option value={ticket.status}>{ticket.status}</option>
                      {validTransitions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {newStatus === 'RESOLVED' && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Resolution Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={isUpdatingStatus}
                        rows="3"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                  )}

                  {isAdmin && newStatus === 'REJECTED' && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Rejection Reason
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={isUpdatingStatus}
                        rows="3"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleStatusChange}
                      disabled={isUpdatingStatus || newStatus === ticket.status}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="h-4 w-4" />
                      Update
                    </button>
                    <button
                      onClick={() => {
                        setShowStatusForm(false)
                        setNewStatus(ticket.status)
                        setNotes('')
                      }}
                      disabled={isUpdatingStatus}
                      className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowStatusForm(true)}
                    disabled={validTransitions.length === 0}
                    className="w-full rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Change Status
                  </button>
                  {validTransitions.length === 0 && (
                    <p className="mt-3 text-center text-xs text-slate-500">
                      No transitions available for this status
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TicketDetailsPage
