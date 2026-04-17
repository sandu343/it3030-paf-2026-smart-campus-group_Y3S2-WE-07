import React, { useState } from 'react'
import { Upload, X } from 'lucide-react'
import { validateAttachments } from '../utils/validationUtils'

export const AttachmentUploader = ({ onFilesSelected, disabled = false }) => {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [errors, setErrors] = useState([])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    
    const validation = validateAttachments(files)
    
    if (!validation.isValid) {
      setErrors(validation.errors.map(error => error.message || error))
      setSelectedFiles([])
    } else {
      setErrors([])
      setSelectedFiles(files)
      onFilesSelected(files)
    }
  }

  const handleRemoveFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    if (newFiles.length === 0) {
      setErrors([])
    }
    onFilesSelected(newFiles)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    handleFileSelect({ target: { files } })
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Attachments (JPG, JPEG, PNG - Max 3 files, 5MB each)
      </label>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition"
      >
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png"
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Drag files here or click to select
          </p>
        </label>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
          {errors.map((error, idx) => (
            <p key={idx} className="text-sm text-red-700">{error}</p>
          ))}
        </div>
      )}

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-600 mb-2">
            {selectedFiles.length}/{3} files selected
          </p>
          <div className="space-y-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={() => handleRemoveFile(idx)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AttachmentUploader
