import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
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
    <div className="min-h-screen bg-[radial-gradient(1000px_600px_at_10%_-10%,#dcfce7_0%,#f8fafc_42%,#f0fdf4_100%)] text-slate-900">
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
      <main className="mx-auto max-w-7xl px-6 py-8">
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
