import React, { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import ticketApiService from '../services/ticketApiService'
import TicketCard from '../components/TicketCard'
import TicketTable from '../components/TicketTable'
import { ErrorAlert } from '../components/ErrorAlert'
import LoadingSpinner from '../components/LoadingSpinner'

export const TicketListPage = ({ isAdmin, isTechnician, onCreateNew, onViewTicket, refreshTrigger }) => {
  const [tickets, setTickets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterPriority, setFilterPriority] = useState('ALL')
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)

  const fetchTickets = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let data
      if (isAdmin) {
        data = await ticketApiService.getAllTickets()
      } else if (isTechnician) {
        data = await ticketApiService.getAssignedTickets()
      } else {
        data = await ticketApiService.getMyTickets()
      }
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load tickets')
      setTickets([])
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin, isTechnician])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets, refreshTrigger])

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      fetchTickets()
    }

    window.addEventListener('smartcampus-notifications-updated', handleNotificationsUpdated)

    return () => window.removeEventListener('smartcampus-notifications-updated', handleNotificationsUpdated)
  }, [fetchTickets])

  const filteredTickets = tickets.filter(t => {
    const statusMatch = filterStatus === 'ALL' || t.status === filterStatus
    const priorityMatch = filterPriority === 'ALL' || t.priority === filterPriority
    return statusMatch && priorityMatch
  })

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && <ErrorAlert message={error} />}

      {/* Content Container */}
      <div className="rounded-[28px] border border-blue-100 bg-[#F8FAFC] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1E3A8A]">
              {isAdmin ? 'All Tickets' : isTechnician ? 'Assigned Tickets' : 'Your Tickets'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {isAdmin ? 'Manage all support requests' : isTechnician ? 'Handle your assigned tickets' : 'View and manage your support requests'}
            </p>
          </div>
          {!isAdmin && (
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#10B981] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-[#059669]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Ticket</span>
            </button>
          )}
        </div>

        {/* Filter and View Mode Controls */}
        <div className="mb-8 space-y-4 border-b border-blue-100 pb-6">
          {/* Top Bar: Count, Filters Toggle, View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Result Count Badge */}
            <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-[#1E3A8A]">
              <span className="inline-block h-3 w-3 rounded-full bg-[#3B82F6]"></span>
              {filteredTickets.length} of {tickets.length}
            </div>

            {/* Filters Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition-all duration-200 ${
                showFilters
                  ? 'bg-[#1E3A8A] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-blue-50'
              }`}
            >
              <svg
                className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              Filters
            </button>

            {/* View Mode Toggle */}
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  viewMode === 'grid'
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-transparent text-gray-700 hover:bg-gray-100'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  viewMode === 'table'
                    ? 'bg-[#1E3A8A] text-white'
                    : 'bg-transparent text-gray-700 hover:bg-gray-100'
                }`}
              >
                Table
              </button>
            </div>
          </div>

          {/* Filter Controls - Expandable */}
          {showFilters && (
            <div className="border-t border-blue-100 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600">
                    Filter by Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-[#3B82F6] focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  {filterStatus !== 'ALL' && (
                    <button
                      onClick={() => setFilterStatus('ALL')}
                      className="mt-2 text-xs font-semibold text-[#1E3A8A] hover:text-[#1E40AF]"
                    >
                      Clear status filter
                    </button>
                  )}
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600">
                    Filter by Priority
                  </label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-[#3B82F6] focus:outline-none"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                  {filterPriority !== 'ALL' && (
                    <button
                      onClick={() => setFilterPriority('ALL')}
                      className="mt-2 text-xs font-semibold text-[#1E3A8A] hover:text-[#1E40AF]"
                    >
                      Clear priority filter
                    </button>
                  )}
                </div>
              </div>

              {/* Active Filters Display */}
              {(filterStatus !== 'ALL' || filterPriority !== 'ALL') && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {filterStatus !== 'ALL' && (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-[#1E3A8A]">
                      Status: {filterStatus.replace(/_/g, ' ')}
                      <button
                        onClick={() => setFilterStatus('ALL')}
                        className="ml-1 font-bold hover:text-[#1E40AF]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {filterPriority !== 'ALL' && (
                    <div className="inline-flex items-center gap-2 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                      Priority: {filterPriority}
                      <button
                        onClick={() => setFilterPriority('ALL')}
                        className="ml-1 font-bold hover:text-amber-900"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner />
        ) : filteredTickets.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} onClick={() => onViewTicket(ticket.id)} className="cursor-pointer">
                  <TicketCard ticket={ticket} onClick={() => onViewTicket(ticket.id)} />
                </div>
              ))}
            </div>
          ) : (
            <TicketTable
              tickets={filteredTickets}
              onTicketClick={onViewTicket}
            />
          )
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-white py-12 text-center">
            <p className="text-lg text-gray-600 mb-4">
              {isAdmin ? 'No tickets found' : isTechnician ? 'No tickets assigned to you yet' : 'You have not created any tickets yet'}
            </p>
            {!isAdmin && (
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#10B981] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-[#059669]"
              >
                <Plus className="h-4 w-4" />
                Create Your First Ticket
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default TicketListPage
