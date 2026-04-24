import React, { useState } from 'react'
import { Save, X, AlertCircle } from 'lucide-react'
import { validateComment } from '../utils/validationUtils'

export const EditCommentForm = ({ initialMessage, onSave, onCancel, isLoading = false }) => {
  const [message, setMessage] = useState(initialMessage)
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()

    const validation = validateComment(message)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setErrors({})
    onSave(message)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
      {errors.message && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {errors.message}
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value)
          if (errors.message) setErrors({})
        }}
        disabled={isLoading}
        maxLength={500}
        rows="3"
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
          errors.message ? 'border-red-500 bg-red-50' : 'border-gray-300'
        }`}
      />

      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">
          {message.length}/500 characters
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 text-sm disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>
    </form>
  )
}

export default EditCommentForm
