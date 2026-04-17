import React, { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import TicketAssistantPanel from './TicketAssistantPanel'

export const TicketAssistantWidget = ({ role }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl shadow-green-300 transition hover:scale-105 hover:bg-green-700"
        aria-label="Open ticket support assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      <TicketAssistantPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        role={role}
      />
    </>
  )
}

export default TicketAssistantWidget
