import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PortalHeader from '../components/PortalHeader'
import { motion } from 'framer-motion'
import bookingService from '../services/bookingService'
import ticketApiService from './Incident_tickting/services/ticketApiService'
import { getActiveCampusAlerts } from '../services/campusAlertService'
import './UserDashboardPage.css'
import {
  AlertTriangle,
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
const ALERT_ROTATION_INTERVAL_MS = 10 * 1000
const ALERT_FETCH_INTERVAL_MS = 10 * 1000

const recentTickets = [
  { title: 'Projector not working', category: 'IT Support', status: 'Open', time: '10 min ago' },
  { title: 'AC maintenance request', category: 'Facilities', status: 'Pending', time: '1 hour ago' },
  { title: 'Network access issue', category: 'ICT', status: 'Resolved', time: 'Yesterday' },
]

const topActions = [
  { label: 'Study Areas', to: '/study-areas', style: 'secondary' },
  { label: 'Book a Resource', to: '/bookings', style: 'primary' },
  { label: 'Report an Issue', to: '/incident-ticketing', style: 'secondary' },
  { label: 'View Notifications', to: '#recent-tickets', style: 'ghost' },
]

const quickActions = [
  {
    title: 'Book a Resource',
    description: 'Reserve rooms, labs, or equipment quickly.',
    icon: CalendarCheck2,
    to: '/bookings',
    accent: 'from-green-600 to-green-700',
  },
  {
    title: 'Report an Issue',
    description: 'Create and track incident tickets with ease.',
    icon: CircleAlert,
    to: '/incident-ticketing',
    accent: 'from-cyan-500 to-cyan-700',
  },
  {
    title: 'Explore Study Areas',
    description: 'Find spaces and check live occupancy hints.',
    icon: BookOpen,
    to: '/study-areas',
    accent: 'from-emerald-500 to-emerald-700',
  },
]

function StatusBadge({ status }) {
  const styles = {
    Open: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    Pending: 'bg-amber-100 text-amber-700 ring-amber-200',
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
    primary:
      'bg-green-600 text-white shadow-lg shadow-green-200 hover:bg-green-700',
    secondary:
      'border border-green-200 bg-white text-green-800 hover:bg-green-50',
    ghost:
      'border border-green-100 bg-green-50 text-green-700 hover:bg-green-100',
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
      className="rounded-[24px] border border-green-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-4xl font-black leading-none text-green-900">{value}</p>
          <p className="mt-2 text-sm font-semibold text-green-600">{change}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
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
        className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-4 transition hover:border-green-200 hover:shadow-md"
      >
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-base font-bold text-green-900">{title}</span>
          <span className="mt-1 block text-sm text-slate-500">{description}</span>
        </span>
        <ArrowRight className="ml-auto h-4 w-4 text-green-600" />
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
  const [campusAlerts, setCampusAlerts] = useState([])
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0)

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

  useEffect(() => {
    const loadCampusAlerts = async () => {
      try {
        const data = await getActiveCampusAlerts()
        const safeAlerts = Array.isArray(data) ? data : []
        setCampusAlerts(safeAlerts)
        setCurrentAlertIndex((prev) => (safeAlerts.length > 0 ? prev % safeAlerts.length : 0))
      } catch (error) {
        console.error('Failed to load campus alerts:', error)
        setCampusAlerts([])
        setCurrentAlertIndex(0)
      }
    }

    loadCampusAlerts()
    const fetchIntervalId = window.setInterval(loadCampusAlerts, ALERT_FETCH_INTERVAL_MS)

    return () => window.clearInterval(fetchIntervalId)
  }, [])

  useEffect(() => {
    if (campusAlerts.length <= 1) {
      return undefined
    }

    const rotateIntervalId = window.setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % campusAlerts.length)
    }, ALERT_ROTATION_INTERVAL_MS)

    return () => window.clearInterval(rotateIntervalId)
  }, [campusAlerts.length])

  const currentCampusAlertMessage = campusAlerts[currentAlertIndex]?.message || ''

  const statCards = [
    { title: 'Total Bookings', value: String(stats.totalBookings), icon: CalendarCheck2, change: '+12% this month' },
    { title: 'Pending Requests', value: String(stats.pendingRequests), icon: ClipboardList, change: '3 awaiting approval' },
    { title: 'Open Tickets', value: String(stats.openTickets), icon: MessageSquareWarning, change: '2 urgent' },
    { title: 'Approved Bookings', value: String(stats.approvedBookings), icon: Bell, change: '+18 this week' },
  ]

  return (
    <div className="min-h-screen bg-[radial-gradient(1000px_600px_at_10%_-10%,#dcfce7_0%,#f8fafc_42%,#f0fdf4_100%)] text-slate-900">

      <PortalHeader
        user={user}
        onLogout={logout}
        isLocationEnabled={isLocationEnabled}
        onToggleLocation={toggleLocation}
        isNotificationOpen={isNotificationOpen}
        setIsNotificationOpen={setIsNotificationOpen}
      />

      <main className="mx-auto grid w-full max-w-[1320px] gap-4 px-4 py-5 sm:px-6">
        <section className="rounded-[24px] border border-green-100 bg-gradient-to-br from-white to-green-50 p-6 shadow-sm md:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
            <div>
              <p className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-green-700">
                Welcome Back
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-green-900">
                Good to see you, {user?.name || 'Naveen'}.
              </h2>
              <p className="mt-3 max-w-2xl text-lg text-slate-600">
                Manage bookings, resources, support tickets, and notifications from a single, streamlined dashboard.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {topActions.map((action) => (
                  <TopActionButton key={action.label} action={action} />
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <MotionDiv
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                className="rounded-[24px] bg-gradient-to-br from-green-700 to-green-800 p-6 text-white shadow-xl shadow-green-200"
              >
                <p className="text-lg font-bold">Today's Overview</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-5xl font-black leading-none">{stats.activeBookings}</p>
                    <p className="mt-2 text-base text-green-100">Active bookings</p>
                  </div>
                  <div>
                    <p className="text-5xl font-black leading-none">{stats.newTickets}</p>
                    <p className="mt-2 text-base text-green-100">New tickets</p>
                  </div>
                </div>
              </MotionDiv>

              <MotionDiv
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="campus-alert-card rounded-[24px] border border-green-100 bg-white p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 text-green-900">
                    <span className="campus-alert-icon-wrap">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-2xl font-extrabold">Campus Alert</p>
                      <p className="text-sm font-semibold text-emerald-700">Updates every 10 seconds</p>
                    </div>
                  </div>
                  {campusAlerts.length > 1 && (
                    <span className="campus-alert-pill">
                      {currentAlertIndex + 1} / {campusAlerts.length}
                    </span>
                  )}
                </div>
                {currentCampusAlertMessage ? (
                  <MotionDiv
                    key={`${currentAlertIndex}-${currentCampusAlertMessage}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="campus-alert-message mt-4"
                  >
                    <p className="text-lg text-slate-700">{currentCampusAlertMessage}</p>
                  </MotionDiv>
                ) : (
                  <p className="mt-4 rounded-2xl border border-dashed border-emerald-200 bg-white/80 px-4 py-3 text-lg text-slate-500">
                    No active campus alerts right now.
                  </p>
                )}

                {campusAlerts.length > 1 && (
                  <div className="mt-4 flex items-center gap-2">
                    {campusAlerts.map((_, index) => (
                      <span
                        key={`alert-dot-${index}`}
                        className={`campus-alert-dot ${index === currentAlertIndex ? 'is-active' : ''}`}
                      />
                    ))}
                  </div>
                )}

                {currentCampusAlertMessage && (
                  <div className="campus-alert-progress mt-4">
                    <span key={`progress-${currentAlertIndex}`} className="campus-alert-progress-bar" />
                  </div>
                )}
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
          <div className="rounded-[24px] border border-green-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-4xl font-black tracking-tight text-green-900">Quick Actions</h3>
                <p className="mt-1 text-lg text-slate-500">Fast access to common campus workflows.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {quickActions.map((action) => (
                <QuickActionCard key={action.title} {...action} />
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-green-100 bg-[linear-gradient(160deg,#f8fffa_0%,#effcf4_100%)] p-5">
              <div className="venn-container">
                <MotionDiv whileHover={{ scale: 1.04 }} className="venn-circle venn-circle-resource">
                  <CalendarCheck2 className="mb-1 h-5 w-5" />
                  <span>Resources & Bookings</span>
                </MotionDiv>
                <MotionDiv whileHover={{ scale: 1.04 }} className="venn-circle venn-circle-support">
                  <Wrench className="mb-1 h-5 w-5" />
                  <span>Support & Issues</span>
                </MotionDiv>
                <MotionDiv whileHover={{ scale: 1.04 }} className="venn-circle venn-circle-study">
                  <BookOpen className="mb-1 h-5 w-5" />
                  <span>Study & Learning</span>
                </MotionDiv>

                <MotionDiv whileHover={{ scale: 1.06 }} className="venn-center">
                  <CircleCheckBig className="h-5 w-5" />
                  <span>Operations Hub</span>
                </MotionDiv>
              </div>
            </div>
          </div>

          <div id="recent-tickets" className="rounded-[24px] border border-green-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-4xl font-black tracking-tight text-green-900">Recent Tickets</h3>
                <p className="mt-1 text-lg text-slate-500">Latest updates from your reported issues.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {recentTickets.map((ticket) => (
                <MotionDiv
                  key={`${ticket.title}-${ticket.time}`}
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  className="flex items-center justify-between gap-3 rounded-[18px] border border-green-100 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="text-xl font-extrabold text-green-900">{ticket.title}</p>
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
