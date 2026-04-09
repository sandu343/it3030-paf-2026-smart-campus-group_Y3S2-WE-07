import React, { useState } from 'react'
import { Send, AlertCircle } from 'lucide-react'
import { validateComment } from '../utils/validationUtils'

export const CommentForm = ({ onSubmit, isLoading = false }) => {
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()

    const validation = validateComment(message)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setErrors({})
    onSubmit(message)
    setMessage('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {errors.message && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          {errors.message}
        </div>
      )}

      <div>
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            if (errors.message) setErrors({})
          }}
          disabled={isLoading}
          placeholder="Add a comment..."
          maxLength={500}
          rows="3"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
            errors.message ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            {message.length}/500 characters
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
      >
        <Send className="h-4 w-4" />
        Post Comment
      </button>
    </form>
  )
}

export default CommentForm
