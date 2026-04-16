import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContextObject'
import PortalHeader from '../components/PortalHeader'
import { motion } from 'framer-motion'
import bookingService from '../services/bookingService'
import ticketApiService from './Incident_tickting/services/ticketApiService'
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarCheck2,
  CircleAlert,
  CircleCheckBig,
  ClipboardList,
  MessageSquareWarning,
  Wrench,
} from 'lucide-react'

const MotionDiv = motion.div
const HIGHLIGHT_ROTATION_INTERVAL_MS = 10 * 1000
const HIGHLIGHT_MESSAGES = [
  'Peak usage notice: Some study areas and lecture halls are currently crowded during peak hours. Please check availability before visiting and consider using less busy spaces for a better study experience.',
  'System update notice: StudyNest now provides improved real-time space availability, complaint tracking, and admin announcements. Explore the new features and use them to plan your study time more effectively.',
  'Responsibility reminder: Please maintain silence, cleanliness, and proper behavior in study areas and lecture halls. Your cooperation helps create a comfortable environment for everyone.',
]

const recentTickets = [
  { title: 'Projector not working', category: 'IT Support', status: 'Open', time: '10 min ago' },
  { title: 'AC maintenance request', category: 'Facilities', status: 'Pending', time: '1 hour ago' },
  { title: 'Network access issue', category: 'ICT', status: 'Resolved', time: 'Yesterday' },
]

const topActions = [
  { label: 'Explore Study Areas', to: '/study-areas', style: 'secondary' },
  { label: 'Open Hall Requests', to: '/bookings', style: 'primary' },
]

const quickActions = [
  {
    title: 'Book a Resource',
    description: 'Reserve rooms, labs, or equipment quickly.',
    icon: CalendarCheck2,
    to: '/bookings',
    accent: 'from-[#1E3A8A] to-[#3B82F6]',
  },
  {
    title: 'Report an Issue',
    description: 'Create and track incident tickets with ease.',
    icon: CircleAlert,
    to: '/incident-ticketing',
    accent: 'from-[#2563EB] to-[#1E3A8A]',
  },
  {
    title: 'Explore Study Areas',
    description: 'Find spaces and check live occupancy hints.',
    icon: BookOpen,
    to: '/study-areas',
    accent: 'from-[#10B981] to-[#059669]',
  },
]

function StatusBadge({ status }) {
  const styles = {
    Open: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    Resolved: 'bg-slate-100 text-slate-700 ring-slate-200',
  }

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  )
}

function TopActionButton({ action }) {
  const classes = {
    primary: 'bg-[#3B82F6] text-white shadow-lg shadow-blue-200 hover:bg-[#1E3A8A]',
    secondary: 'border border-slate-200 bg-white text-[#1E3A8A] hover:border-blue-200 hover:bg-blue-50',
    ghost: 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
  }

  const className = `inline-flex items-center rounded-[14px] px-4 py-2.5 text-sm font-bold transition ${classes[action.style]}`

  if (action.to.startsWith('/')) {
    return (
      <Link to={action.to} className={className}>
        {action.label}
      </Link>
    )
  }

  return (
    <a href={action.to} className={className}>
      {action.label}
    </a>
  )
}

function StatCard({ title, value, icon, change }) {
  const Icon = icon

  return (
    <MotionDiv
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(30,58,138,0.06)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-4xl font-black leading-none text-slate-900">{value}</p>
          <p className="mt-2 text-sm font-semibold text-[#10B981]">{change}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-[#1E3A8A]">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </MotionDiv>
  )
}

function QuickActionCard({ title, description, icon, to, accent }) {
  const Icon = icon

  return (
    <MotionDiv whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
      <Link
        to={to}
        className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-[0_18px_36px_rgba(59,130,246,0.12)]"
      >
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-base font-bold text-slate-900">{title}</span>
          <span className="mt-1 block text-sm text-slate-500">{description}</span>
        </span>
        <ArrowRight className="ml-auto h-4 w-4 text-[#1E3A8A]" />
      </Link>
    </MotionDiv>
  )
}

const UserDashboardPage = () => {
  const { user, logout } = useAuth()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingRequests: 0,
    openTickets: 0,
    approvedBookings: 0,
    activeBookings: 0,
    newTickets: 0,
  })
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0)

  const [isLocationEnabled, setIsLocationEnabled] = useState(() => {
    return localStorage.getItem('studyAreaLocationPreference') === 'enabled'
  })

  const toggleLocation = () => {
    const newState = !isLocationEnabled
    if (newState) {
      localStorage.setItem('studyAreaLocationPreference', 'enabled')
    } else {
      localStorage.removeItem('studyAreaLocationPreference')
    }
    setIsLocationEnabled(newState)
  }

  useEffect(() => {
    const loadDashboardStats = async () => {
      const userId = user?.id || user?._id
      if (!userId) {
        return
      }

      try {
        const [bookings, tickets] = await Promise.all([
          bookingService.getUserBookings(userId),
          ticketApiService.getMyTickets(),
        ])

        const safeBookings = Array.isArray(bookings)
          ? bookings
          : Array.isArray(bookings?.data)
            ? bookings.data
            : []
        const safeTickets = Array.isArray(tickets)
          ? tickets
          : Array.isArray(tickets?.data)
            ? tickets.data
            : []

        const today = new Date()
        const isSameDay = (dateValue) => {
          if (!dateValue) {
            return false
          }

          const date = new Date(dateValue)
          if (Number.isNaN(date.getTime())) {
            return false
          }

          return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
          )
        }

        const activeBookingsCount = safeBookings.filter(
          (b) => b.status === 'PENDING' || b.status === 'APPROVED'
        ).length
        const newTicketsCount = safeTickets.filter((t) => isSameDay(t.createdAt)).length

        setStats({
          totalBookings: safeBookings.length,
          pendingRequests: safeBookings.filter((b) => b.status === 'PENDING').length,
          openTickets: safeTickets.filter((t) => t.status === 'OPEN').length,
          approvedBookings: safeBookings.filter((b) => b.status === 'APPROVED').length,
          activeBookings: activeBookingsCount,
          newTickets: newTicketsCount,
        })
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
      }
    }

    loadDashboardStats()
  }, [user?.id, user?._id])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentHighlightIndex((prev) => (prev + 1) % HIGHLIGHT_MESSAGES.length)
    }, HIGHLIGHT_ROTATION_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      const userId = user?.id || user?._id
      if (!userId) {
        return
      }

      bookingService.getUserBookings(userId)
        .then((bookings) => {
          const safeBookings = Array.isArray(bookings)
            ? bookings
            : Array.isArray(bookings?.data)
              ? bookings.data
              : []

          return ticketApiService.getMyTickets().then((tickets) => {
            const safeTickets = Array.isArray(tickets)
              ? tickets
              : Array.isArray(tickets?.data)
                ? tickets.data
                : []

            const today = new Date()
            const isSameDay = (dateValue) => {
              if (!dateValue) {
                return false
              }

              const date = new Date(dateValue)
              if (Number.isNaN(date.getTime())) {
                return false
              }

              return (
                date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate()
              )
            }

            const activeBookingsCount = safeBookings.filter(
              (booking) => booking.status === 'PENDING' || booking.status === 'APPROVED'
            ).length
            const newTicketsCount = safeTickets.filter((ticket) => isSameDay(ticket.createdAt)).length

            setStats({
              totalBookings: safeBookings.length,
              pendingRequests: safeBookings.filter((booking) => booking.status === 'PENDING').length,
              openTickets: safeTickets.filter((ticket) => ticket.status === 'OPEN').length,
              approvedBookings: safeBookings.filter((booking) => booking.status === 'APPROVED').length,
              activeBookings: activeBookingsCount,
              newTickets: newTicketsCount,
            })
          })
        })
        .catch((error) => {
          console.error('Failed to refresh dashboard stats after notification:', error)
        })
    }

    window.addEventListener('smartcampus-notifications-updated', handleNotificationsUpdated)

    return () => window.removeEventListener('smartcampus-notifications-updated', handleNotificationsUpdated)
  }, [user?.id, user?._id])

  const statCards = [
    { title: 'Total Bookings', value: String(stats.totalBookings), icon: CalendarCheck2, change: '+12% this month' },
    { title: 'Pending Requests', value: String(stats.pendingRequests), icon: ClipboardList, change: '3 awaiting approval' },
    { title: 'Open Tickets', value: String(stats.openTickets), icon: MessageSquareWarning, change: '2 urgent' },
    { title: 'Approved Bookings', value: String(stats.approvedBookings), icon: Bell, change: '+18 this week' },
  ]

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_680px_at_10%_-10%,rgba(59,130,246,0.10)_0%,#F8FAFC_42%,#F5F7FA_100%)] text-slate-900">
      <PortalHeader
        user={user}
        onLogout={logout}
        isLocationEnabled={isLocationEnabled}
        onToggleLocation={toggleLocation}
        isNotificationOpen={isNotificationOpen}
        setIsNotificationOpen={setIsNotificationOpen}
      />

      <main className="mx-auto grid w-full max-w-[1320px] gap-4 px-4 py-5 sm:px-6">
        <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_65%,#f5f7fa_100%)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
            <div>
              <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-[#1E3A8A]">
                StudyNest Smart Campus
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                Welcome back, {user?.name || 'Naveen'}
              </h2>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
                Real-time occupancy, volunteer-powered hall intelligence, and data-driven campus operations in one premium workspace.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {topActions.map((action) => (
                  <TopActionButton key={action.label} action={action} />
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <MotionDiv
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 text-slate-900">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-[#1E3A8A]">
                      <Bell className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-2xl font-extrabold">Student Highlights</p>
                      <p className="text-sm font-semibold text-slate-500">Quick reminders for better campus planning.</p>
                    </div>
                  </div>
                </div>
                <MotionDiv
                  key={`highlight-${currentHighlightIndex}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-base text-slate-700"
                >
                  {HIGHLIGHT_MESSAGES[currentHighlightIndex]}
                </MotionDiv>
              </MotionDiv>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-4xl font-black tracking-tight text-slate-900">Quick Actions</h3>
                <p className="mt-1 text-lg text-slate-500">Fast access to common campus workflows.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {quickActions.map((action) => (
                <QuickActionCard key={action.title} {...action} />
              ))}
            </div>
          </div>

          <div id="recent-tickets" className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-4xl font-black tracking-tight text-slate-900">Recent Tickets</h3>
                <p className="mt-1 text-lg text-slate-500">Latest updates from your reported issues.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {recentTickets.map((ticket) => (
                <MotionDiv
                  key={`${ticket.title}-${ticket.time}`}
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-xl font-extrabold text-slate-900">{ticket.title}</p>
                    <p className="mt-1 text-base text-slate-500">{ticket.category} • {ticket.time}</p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </MotionDiv>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default UserDashboardPage
