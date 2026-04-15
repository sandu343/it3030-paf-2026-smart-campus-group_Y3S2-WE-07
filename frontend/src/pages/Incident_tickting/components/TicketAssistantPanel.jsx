import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Send, X, Sparkles } from 'lucide-react'
import ticketAssistantApi from '../services/ticketAssistantApi'

const FALLBACK_MESSAGE = "I couldn't understand that. Try asking about ticket status, SLA, technician assignment, or comments."

const buildQuickActions = (role) => {
  if (role === 'ADMIN') {
    return [
      { label: 'Show all open tickets', query: 'show all open tickets' },
      { label: 'Show urgent tickets', query: 'show urgent tickets' },
      { label: 'Show overdue tickets', query: 'show overdue tickets' },
      { label: 'Which tickets are unassigned?', query: 'which tickets are unassigned' },
      { label: 'Show SLA summary', query: 'show sla summary' },
      { label: 'Which tickets need immediate attention?', query: 'which tickets need immediate attention' }
    ]
  }

  if (role === 'TECHNICIAN') {
    return [
      { label: 'Show my assigned tickets', query: 'show my assigned tickets' },
      { label: 'Which ticket is highest priority?', query: 'which ticket is highest priority' },
      { label: 'Which assigned tickets are overdue?', query: 'which assigned tickets are overdue' },
      { label: 'What is the next valid status for this ticket?', query: 'what is the next valid status for this ticket' },
      { label: 'Show comments for my assigned tickets', query: 'show comments for my assigned tickets' }
    ]
  }

  return [
    { label: 'My Open Tickets', query: 'show my tickets' },
    { label: 'Latest Ticket Status', query: 'what is my latest ticket status' },
    { label: 'Assigned Technician', query: 'who is assigned technician for my ticket' },
    { label: 'SLA Details', query: 'show sla deadline' },
    { label: 'Latest Comments', query: 'show latest comments' },
    { label: 'How to Report an Issue', query: 'how to create ticket' },
    { label: 'How to Upload Evidence', query: 'how to upload attachments' }
  ]
}

const buildWelcomeMessage = (role) => {
  if (role === 'ADMIN') {
    return 'Hi Admin. I can summarize urgent, overdue, unassigned, and SLA-critical tickets.'
  }

  if (role === 'TECHNICIAN') {
    return 'Hi Technician. I can help you track assigned tickets, priorities, next statuses, and SLA risk.'
  }

  return 'Hi! I can help with your ticket statuses, assigned technician, comments, and SLA deadlines.'
}

export const TicketAssistantPanel = ({ isOpen, onClose, role }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const quickActions = useMemo(() => buildQuickActions(role), [role])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setMessages([
      {
        id: 'assistant-welcome',
        sender: 'assistant',
        text: buildWelcomeMessage(role),
        type: 'welcome'
      }
    ])
    setInput('')
  }, [isOpen, role])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const sendMessage = async (messageText, displayText = messageText) => {
    const text = messageText.trim()
    if (!text || isLoading) {
      return
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: displayText.trim()
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await ticketAssistantApi.askTicketAssistant(text)

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: response?.reply || FALLBACK_MESSAGE,
          type: response?.type || 'fallback',
          data: response?.data || null
        }
      ])
    } catch (error) {
      const statusText = error?.status ? `HTTP ${error.status}` : 'Network/Error'
      const messageTextSafe = error?.message || 'Assistant API request failed'
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          sender: 'assistant',
          text: `${statusText}: ${messageTextSafe}`,
          type: 'error'
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(input)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-md border-l border-green-100 bg-white shadow-2xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-green-100 bg-green-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-600 p-2 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-green-900">Ticket Support Assistant</h3>
              <p className="text-xs text-green-700">Intent-based help for incident tickets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-700"
            aria-label="Close assistant"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-white to-green-50/30 px-4 py-4">
          <div className="rounded-2xl border border-green-100 bg-white p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-green-700">
              <Sparkles className="h-4 w-4" />
              Quick Actions
            </div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.query, action.label)}
                  disabled={isLoading}
                  className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  message.sender === 'user'
                    ? 'bg-green-600 text-white'
                    : 'border border-green-100 bg-white text-slate-700'
                }`}
              >
                {message.text}

                {message.sender === 'assistant' && message.type === 'ai_summary' && message.data && (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-green-100 pt-3 text-xs">
                    {typeof message.data.open === 'number' && (
                      <div className="rounded-lg bg-green-50 px-2 py-1.5 font-semibold text-green-800">
                        Open: {message.data.open}
                      </div>
                    )}
                    {typeof message.data.urgent === 'number' && (
                      <div className="rounded-lg bg-amber-50 px-2 py-1.5 font-semibold text-amber-800">
                        Urgent: {message.data.urgent}
                      </div>
                    )}
                    {typeof message.data.overdue === 'number' && (
                      <div className="rounded-lg bg-red-50 px-2 py-1.5 font-semibold text-red-800">
                        Overdue: {message.data.overdue}
                      </div>
                    )}
                    {typeof message.data.unassigned === 'number' && (
                      <div className="rounded-lg bg-slate-100 px-2 py-1.5 font-semibold text-slate-700">
                        Unassigned: {message.data.unassigned}
                      </div>
                    )}
                    {message.data.highestPriorityTitle && (
                      <div className="col-span-2 rounded-lg bg-blue-50 px-2 py-1.5 font-semibold text-blue-800">
                        Focus: {message.data.highestPriorityTitle}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-green-100 bg-white px-4 py-2.5 text-sm text-slate-600">
                Assistant is checking tickets...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-green-100 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about status, SLA, assignment, comments..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-green-500 focus:outline-none"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-green-600 p-2.5 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TicketAssistantPanel
