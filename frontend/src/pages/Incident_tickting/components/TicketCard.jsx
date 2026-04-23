import React from 'react'
import { StatusBadge, PriorityBadge } from './StatusBadge'
import SLABadge from './SLABadge'
import { ChevronRight } from 'lucide-react'

export const TicketCard = ({ ticket, onClick }) => {
  const createdDate = new Date(ticket.createdAt).toLocaleDateString()

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition hover:border-[#3B82F6] hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="mb-1 line-clamp-2 text-lg font-bold text-[#1E3A8A] transition group-hover:text-[#3B82F6]">
            {ticket.title}
          </h3>
          <p className="line-clamp-2 text-sm text-slate-600">
            {ticket.description}
          </p>
        </div>
        <ChevronRight className="ml-2 h-5 w-5 flex-shrink-0 text-slate-400 transition group-hover:text-slate-600 group-hover:translate-x-0.5" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue-100 pt-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={ticket.status} size="sm" />
          <PriorityBadge priority={ticket.priority} size="sm" />
          {ticket.escalationLevel && (
            <SLABadge 
              slaDeadline={ticket.slaDeadline}
              escalationLevel={ticket.escalationLevel}
              isOverdue={ticket.isOverdue}
              size="sm"
              showTime={true}
            />
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span>{createdDate}</span>
          {ticket.comments && ticket.comments.length > 0 && (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-semibold text-[#1E3A8A]">
              {ticket.comments.length} comments
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default TicketCard
