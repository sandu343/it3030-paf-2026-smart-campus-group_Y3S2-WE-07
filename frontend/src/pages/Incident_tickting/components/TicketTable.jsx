import React from 'react'
import { StatusBadge, PriorityBadge } from './StatusBadge'
import { formatDate } from '../utils/formatUtils'

export const TicketTable = ({ tickets = [], onTicketClick }) => {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Reported By Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tickets && tickets.length > 0 ? (
            tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => onTicketClick(ticket.id)}
                className="hover:bg-gray-50 transition cursor-pointer"
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
