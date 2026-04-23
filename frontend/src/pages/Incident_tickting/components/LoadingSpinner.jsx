import React from 'react'

export const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#1E3A8A]"></div>
      </div>
      {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
    </div>
  )
}

export default LoadingSpinner
