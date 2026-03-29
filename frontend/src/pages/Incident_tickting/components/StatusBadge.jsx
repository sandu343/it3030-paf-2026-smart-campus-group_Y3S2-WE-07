import React from 'react'

export const StatusBadge = ({ status, size = 'md' }) => {
  const statusStyles = {
    OPEN: 'bg-blue-100 text-blue-800 border border-blue-300',
    IN_PROGRESS: 'bg-orange-100 text-orange-800 border border-orange-300',
    RESOLVED: 'bg-green-100 text-green-800 border border-green-300',
    CLOSED: 'bg-gray-100 text-gray-800 border border-gray-300',
    REJECTED: 'bg-red-100 text-red-800 border border-red-300'
  }

  const sizeStyles = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }

  return (
    <span className={`inline-block rounded-full font-semibold ${statusStyles[status]} ${sizeStyles[size]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export const PriorityBadge = ({ priority, size = 'md' }) => {
  const priorityStyles = {
    LOW: 'bg-blue-100 text-blue-800 border border-blue-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    HIGH: 'bg-orange-100 text-orange-800 border border-orange-300',
    URGENT: 'bg-red-100 text-red-800 border border-red-300'
  }

  const sizeStyles = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }

  return (
    <span className={`inline-block rounded-full font-semibold ${priorityStyles[priority]} ${sizeStyles[size]}`}>
      {priority}
    </span>
  )
}
