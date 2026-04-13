import React from 'react'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

export const ErrorAlert = ({ message, details }) => {
  if (!message) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800">{message}</p>
        {details && Object.keys(details).length > 0 && (
          <ul className="mt-2 text-sm text-red-700 list-disc pl-5">
            {Object.entries(details).map(([key, value]) => (
              <li key={key}>{value}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export const SuccessAlert = ({ message }) => {
  if (!message) return null

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
      <p className="text-sm font-medium text-green-800">{message}</p>
    </div>
  )
}

export const InfoAlert = ({ message }) => {
  if (!message) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
      <p className="text-sm font-medium text-blue-800">{message}</p>
    </div>
  )
}
