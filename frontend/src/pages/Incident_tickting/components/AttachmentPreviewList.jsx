import React from 'react'
import { Image } from 'lucide-react'

export const AttachmentPreviewList = ({ attachmentUrls = [] }) => {
  if (!attachmentUrls || attachmentUrls.length === 0) {
    return null
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-900 mb-3">Attachments</h4>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {attachmentUrls.map((url, idx) => (
          <div key={idx} className="relative group">
            <img
              src={url}
              alt={`Attachment ${idx + 1}`}
              className="w-full h-32 object-cover rounded-lg border border-gray-200"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition flex items-center justify-center">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 transition"
              >
                <Image className="h-6 w-6 text-white" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AttachmentPreviewList
