import React from 'react'
import { StatusBadge, PriorityBadge } from './StatusBadge'
import { formatDate } from '../utils/formatUtils'

export const TicketTable = ({ tickets = [], onTicketClick }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-blue-100 bg-white">
      <table className="w-full">
        <thead className="border-b border-blue-100 bg-blue-50/60">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#1E3A8A]">
              Reported By Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#1E3A8A]">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#1E3A8A]">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#1E3A8A]">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#1E3A8A]">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#1E3A8A]">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-100">
          {tickets && tickets.length > 0 ? (
            tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => onTicketClick(ticket.id)}
                className="cursor-pointer transition hover:bg-blue-50/60"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {ticket.reportedByEmail || ticket.reportedByName || 'Unknown'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {ticket.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {ticket.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={ticket.status} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PriorityBadge priority={ticket.priority} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(ticket.createdAt)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                No tickets found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default TicketTable
