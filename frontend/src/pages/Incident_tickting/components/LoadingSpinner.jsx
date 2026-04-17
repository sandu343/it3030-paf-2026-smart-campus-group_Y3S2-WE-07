import React from 'react'

export const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-green-600 rounded-full animate-spin"></div>
      </div>
      {message && <p className="mt-4 text-gray-600 text-sm">{message}</p>}
    </div>
  )
}

export default LoadingSpinner
