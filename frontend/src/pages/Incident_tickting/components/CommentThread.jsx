import React, { useState } from 'react'
import { Edit2, Trash2, AlertCircle } from 'lucide-react'
import CommentForm from './CommentForm'
import EditCommentForm from './EditCommentForm'
import { formatDateTime } from '../utils/formatUtils'
import ticketApiService from '../services/ticketApiService'
import { ErrorAlert } from './ErrorAlert'

export const CommentThread = ({ ticketId, comments = [], currentUserId, isAdmin = false, onCommentAdded }) => {
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleAddComment = async (message) => {
    setIsLoading(true)
    setError(null)
    
    try {
      await ticketApiService.addComment(ticketId, { message })
      setIsAddingComment(false)
      onCommentAdded()
    } catch (err) {
      setError(err.message || 'Failed to add comment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateComment = async (commentId, message) => {
    setIsLoading(true)
    setError(null)
    
    try {
      await ticketApiService.updateComment(ticketId, commentId, { message })
      setEditingCommentId(null)
      onCommentAdded()
    } catch (err) {
      setError(err.message || 'Failed to update comment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      await ticketApiService.deleteComment(ticketId, commentId)
      onCommentAdded()
    } catch (err) {
      setError(err.message || 'Failed to delete comment')
    } finally {
      setIsLoading(false)
    }
  }

  const canEditComment = (comment) => comment.userId === currentUserId
  const canDeleteComment = (comment) => comment.userId === currentUserId || isAdmin

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
        {comments && comments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4">
                {editingCommentId === comment.id ? (
                  <EditCommentForm
                    initialMessage={comment.message}
                    onSave={(msg) => handleUpdateComment(comment.id, msg)}
                    onCancel={() => setEditingCommentId(null)}
                    isLoading={isLoading}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{comment.userName}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(comment.createdAt)}</p>
                      </div>
                      <div className="flex gap-2">
                        {canEditComment(comment) && (
                          <button
                            onClick={() => setEditingCommentId(comment.id)}
                            disabled={isLoading}
                            className="text-blue-600 hover:text-blue-800 p-1 disabled:opacity-50"
                            title="Edit comment"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {canDeleteComment(comment) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                            title="Delete comment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.message}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm">No comments yet</p>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && <ErrorAlert message={error} />}

      {/* Add Comment Form */}
      {isAddingComment ? (
        <CommentForm onSubmit={handleAddComment} isLoading={isLoading} />
      ) : (
        <button
          onClick={() => setIsAddingComment(true)}
          className="w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          Add a comment...
        </button>
      )}
    </div>
  )
}

export default CommentThread
