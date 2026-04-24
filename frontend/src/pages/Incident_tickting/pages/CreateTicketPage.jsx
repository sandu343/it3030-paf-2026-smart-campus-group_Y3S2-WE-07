import React from 'react'
import { ArrowLeft } from 'lucide-react'
import CreateTicketForm from './CreateTicketForm'

export const CreateTicketPage = ({ onSuccess, onCancel }) => {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tickets
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Container */}
        <div className="lg:col-span-2 rounded-3xl border border-green-100 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-green-900">Create New Ticket</h2>
            <p className="mt-1 text-sm text-slate-600">
              Describe your issue and we'll help you resolve it
            </p>
          </div>
          <CreateTicketForm onSuccess={onSuccess} />
        </div>

        {/* Quick Tips Sidebar */}
        <div className="rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 to-green-50/50 p-8 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-green-900 mb-4">Quick Tips</h3>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-xs flex-shrink-0">✓</span>
              <span>Be specific in your title</span>
            </li>
            <li className="flex gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-xs flex-shrink-0">✓</span>
              <span>Include all relevant details</span>
            </li>
            <li className="flex gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-xs flex-shrink-0">✓</span>
              <span>Add attachments if helpful</span>
            </li>
            <li className="flex gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-xs flex-shrink-0">✓</span>
              <span>Provide valid contact info</span>
            </li>
            <li className="flex gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold text-xs flex-shrink-0">✓</span>
              <span>Choose appropriate priority</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CreateTicketPage
