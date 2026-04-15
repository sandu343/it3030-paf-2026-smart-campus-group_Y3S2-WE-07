import React, { useState, useEffect } from 'react'
import { AlertTriangle, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export const SLABadge = ({ slaDeadline, escalationLevel, size = 'md', showTime = true }) => {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    const updateTimer = () => {
      if (!slaDeadline) return

      const deadline = new Date(slaDeadline)
      const now = new Date()
      const diffMs = deadline - now

      if (diffMs < 0) {
        // Overdue
        const diffMinutes = Math.floor(Math.abs(diffMs) / 60000)
        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60
        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m overdue`)
        } else {
          setTimeRemaining(`${minutes}m overdue`)
        }
      } else {
        // Remaining
        const diffMinutes = Math.floor(diffMs / 60000)
        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60
        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m remaining`)
        } else {
          setTimeRemaining(`${minutes}m remaining`)
        }
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [slaDeadline])

  const escalationStyles = {
    NORMAL: 'bg-green-100 text-green-800 border-green-300',
    WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    CRITICAL: 'bg-orange-100 text-orange-800 border-orange-300',
    OVERDUE: 'bg-red-100 text-red-800 border-red-300'
  }

  const getIcon = (level) => {
    switch (level) {
      case 'NORMAL':
        return <CheckCircle className="h-4 w-4" />
      case 'WARNING':
        return <Clock className="h-4 w-4" />
      case 'CRITICAL':
        return <AlertTriangle className="h-4 w-4" />
      case 'OVERDUE':
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const sizeStyles = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  if (!escalationLevel || !slaDeadline) {
    return null
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border font-semibold ${escalationStyles[escalationLevel]} ${sizeStyles[size]}`}>
      {getIcon(escalationLevel)}
      <span>{escalationLevel}</span>
      {showTime && timeRemaining && (
        <span className="text-xs opacity-75">({timeRemaining})</span>
      )}
    </div>
  )
}

export default SLABadge
