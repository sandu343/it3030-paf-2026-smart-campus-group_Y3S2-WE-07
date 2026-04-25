import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContextObject'
import { useNavigate } from 'react-router-dom'
import PortalHeader from '../../components/PortalHeader'
import TicketListPage from './pages/TicketListPage'
import CreateTicketPage from './pages/CreateTicketPage'
import TicketDetailsPage from './pages/TicketDetailsPage'
import TicketAssistantWidget from './components/TicketAssistantWidget'

export const IncidentTicketingPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState('list')
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isLocationEnabled, setIsLocationEnabled] = useState(() => {
    return localStorage.getItem('studyAreaLocationPreference') === 'enabled'
  })

  const isAdmin = user?.role === 'ADMIN'
  const isTechnician = user?.role === 'TECHNICIAN'

  const handleViewTicket = (ticketId) => {
    setSelectedTicketId(ticketId)
    setCurrentView('details')
  }

  const handleCreateNew = () => {
    if (isAdmin) {
      return
    }
    setCurrentView('create')
  }

  const handleCreateSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
    setCurrentView('list')
  }

  const handleBack = () => {
    setCurrentView('list')
    setSelectedTicketId(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateBack = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_700px_at_12%_-12%,#dcfce7_0%,#f8fafc_45%,#eefbf3_100%)] text-slate-900">
      <PortalHeader
        user={user}
        onLogout={handleLogout}
        onBack={handleNavigateBack}
        showBackButton
        isLocationEnabled={isLocationEnabled}
        onToggleLocation={() => setIsLocationEnabled((value) => {
          const nextValue = !value
          if (nextValue) {
            localStorage.setItem('studyAreaLocationPreference', 'enabled')
          } else {
            localStorage.removeItem('studyAreaLocationPreference')
          }
          return nextValue
        })}
        isNotificationOpen={isNotificationOpen}
        setIsNotificationOpen={setIsNotificationOpen}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-28">
        <section className="mb-6 rounded-3xl border border-emerald-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-emerald-900 sm:text-2xl">Incident Ticketing</h1>
              <p className="mt-1 text-sm text-slate-600">
                Raise issues, track updates, and manage support requests from a single place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-800">
                Role: {isAdmin ? 'Admin' : isTechnician ? 'Technician' : 'User'}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                {currentView === 'list' ? 'Ticket List' : currentView === 'create' ? 'Create Ticket' : 'Ticket Details'}
              </span>
            </div>
          </div>
        </section>

        {currentView === 'list' && (
          <TicketListPage
            isAdmin={isAdmin}
            isTechnician={isTechnician}
            currentUserId={user?.id}
            onCreateNew={handleCreateNew}
            onViewTicket={handleViewTicket}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'create' && !isAdmin && (
          <CreateTicketPage
            onSuccess={handleCreateSuccess}
            onCancel={handleBack}
          />
        )}

        {currentView === 'details' && selectedTicketId && (
          <TicketDetailsPage
            ticketId={selectedTicketId}
            isAdmin={isAdmin}
            isTechnician={isTechnician}
            currentUserId={user?.id}
            onBack={handleBack}
          />
        )}
      </main>

      <TicketAssistantWidget role={user?.role} />
    </div>
  )
}

export default IncidentTicketingPage
