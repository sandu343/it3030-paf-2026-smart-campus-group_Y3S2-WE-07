import React, { useState, useEffect, useRef } from 'react'
import { AlertCircle, Search } from 'lucide-react'
import { useAuth } from '../../../context/AuthContextObject'
import bookingService from '../../../services/bookingService'
import { validateTicketForm, validateField } from '../utils/validationUtils'
import ticketApiService from '../services/ticketApiService'
import { ErrorAlert, SuccessAlert } from '../components/ErrorAlert'
import LoadingSpinner from '../components/LoadingSpinner'
import AttachmentUploader from '../components/AttachmentUploader'

// Predefined ticket categories
const TICKET_CATEGORIES = [
  'IT Support',
  'Facilities',
  'Electrical',
  'Network',
  'Safety',
  'Cleaning',
  'Furniture',
  'Air Conditioning',
  'Projector / Equipment',
  'Other'
]

export const CreateTicketForm = ({ onSuccess }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    contactNumber: '',
    location: '',
    priority: 'MEDIUM',
    preferredContact: '',
    attachments: []
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [resources, setResources] = useState([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [filteredResources, setFilteredResources] = useState([])
  const [selectedResource, setSelectedResource] = useState(null)
  const locationInputRef = useRef(null)

  // Auto-fill preferred contact with user's email and contact number on component mount
  useEffect(() => {
    if (user) {
      if (user.email && !formData.preferredContact) {
        setFormData(prev => ({ ...prev, preferredContact: user.email }))
        // Mark as touched so validation runs on subsequent changes
        setTouched(prev => ({ ...prev, preferredContact: true }))
      }
      if (user.phoneNumber && !formData.contactNumber) {
        setFormData(prev => ({ ...prev, contactNumber: user.phoneNumber }))
        // Mark as touched so validation runs on subsequent changes
        setTouched(prev => ({ ...prev, contactNumber: true }))
      }
    }
  }, [user, formData.preferredContact, formData.contactNumber])

  // Load resources on component mount
  useEffect(() => {
    const loadResources = async () => {
      try {
        setResourcesLoading(true)
        const data = await bookingService.fetchResources()
        setResources(data || [])
      } catch (err) {
        console.error('Error loading resources:', err)
        setResources([])
      } finally {
        setResourcesLoading(false)
      }
    }

    loadResources()
  }, [])

  // Filter resources based on location input
  useEffect(() => {
    if (!formData.location.trim()) {
      setFilteredResources([])
      setSelectedResource(null)
      return
    }

    const searchTerm = formData.location.toLowerCase()
    const filtered = resources.filter(resource => {
      const hallName = resource.hallName?.toLowerCase() || ''
      const buildingName = resource.buildingName?.toLowerCase() || ''
      const blockName = resource.blockName?.toLowerCase() || ''
      const floorNumber = resource.floorNumber?.toString() || ''
      
      return (
        hallName.includes(searchTerm) ||
        buildingName.includes(searchTerm) ||
        blockName.includes(searchTerm) ||
        floorNumber.includes(searchTerm)
      )
    })

    setFilteredResources(filtered)
  }, [formData.location, resources])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Mark field as touched when user starts typing
    setTouched(prev => ({ ...prev, [name]: true }))
    
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Validate field on every change (touched or not)
    const error = validateField(name, value, formData, selectedResource)
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleFieldBlur = (e) => {
    const { name } = e.target
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }))
    
    // Validate field immediately on blur
    const error = validateField(name, formData[name], formData, selectedResource)
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleLocationChange = (e) => {
    const { value } = e.target
    setFormData(prev => ({ ...prev, location: value }))
    setShowLocationSuggestions(true)
    setSelectedResource(null)
    
    // Validate field on change if it has been touched
    if (touched.location) {
      const error = validateField('location', value, formData, null)
      if (error) {
        setErrors(prev => ({ ...prev, location: error }))
      } else {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.location
          return newErrors
        })
      }
    }
  }

  const handleLocationBlur = () => {
    // Mark field as touched
    setTouched(prev => ({ ...prev, location: true }))
    
    // Validate field immediately on blur
    const error = validateField('location', formData.location, formData, selectedResource)
    if (error) {
      setErrors(prev => ({ ...prev, location: error }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.location
        return newErrors
      })
    }
  }

  const handleSelectResource = (resource) => {
    const displayName = `${resource.hallName} - Building ${resource.buildingName}, Block ${resource.blockName}, Floor ${resource.floorNumber}`
    setFormData(prev => ({ ...prev, location: displayName }))
    setSelectedResource(resource)
    setShowLocationSuggestions(false)
    setFilteredResources([])
    
    // Mark location as touched and clear any error
    setTouched(prev => ({ ...prev, location: true }))
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.location
      return newErrors
    })
  }

  const handleFilesSelected = (files) => {
    setFormData(prev => ({ ...prev, attachments: files }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMessage(null)

    // Validate form
    const validation = validateTicketForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        contactNumber: formData.contactNumber?.trim() || null,
        resourceId: selectedResource?.id || null,
        location: formData.location?.trim() || null,
        priority: formData.priority,
        preferredContact: formData.preferredContact.trim()
      }

      await ticketApiService.createTicket(submitData)
      setSuccessMessage('Ticket created successfully!')
      
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to create ticket' })
    } finally {
      setIsLoading(false)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationInputRef.current && !locationInputRef.current.contains(e.target)) {
        setShowLocationSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Incident Ticket</h2>

      {successMessage && <SuccessAlert message={successMessage} />}
      {errors.submit && <ErrorAlert message={errors.submit} />}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            onBlur={handleFieldBlur}
            placeholder="Brief description of the issue"
            maxLength={100}
            disabled={isLoading}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
              touched.title && errors.title ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300'
            } disabled:bg-gray-100`}
          />
          <div className="flex justify-between mt-1">
            {touched.title && errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
            {touched.title && !errors.title && <p className="text-xs text-green-600">✓</p>}
            <p className="text-xs text-gray-500">{formData.title.length}/100</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            onBlur={handleFieldBlur}
            placeholder="Detailed description of the incident"
            maxLength={1000}
            rows="4"
            disabled={isLoading}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
              touched.description && errors.description ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300'
            } disabled:bg-gray-100`}
          />
          <div className="flex justify-between mt-1">
            {touched.description && errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
            {touched.description && !errors.description && <p className="text-xs text-green-600">✓</p>}
            <p className="text-xs text-gray-500">{formData.description.length}/1000</p>
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            onBlur={handleFieldBlur}
            disabled={isLoading}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
              touched.priority && errors.priority ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300'
            } disabled:bg-gray-100`}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          {touched.priority && errors.priority && <p className="text-xs text-red-600 mt-1">{errors.priority}</p>}
          {touched.priority && !errors.priority && <p className="text-xs text-green-600 mt-1">✓</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            onBlur={handleFieldBlur}
            disabled={isLoading}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
              touched.category && errors.category ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300'
            } disabled:bg-gray-100`}
          >
            <option value="">-- Select a Category --</option>
            {TICKET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {touched.category && errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
          {touched.category && !errors.category && <p className="text-xs text-green-600 mt-1">✓</p>}
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
          <p className="text-xs text-gray-500 mb-2">
            {user && user.phoneNumber ? 'Your phone number has been pre-filled. You can edit it.' : 'Provide a valid contact phone number'}
          </p>
          <input
            type="tel"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleInputChange}
            onBlur={handleFieldBlur}
            placeholder="e.g., 0712345678 or +94712345678 or 077-1234567"
            disabled={isLoading}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
              touched.contactNumber && errors.contactNumber ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300'
            } disabled:bg-gray-100`}
          />
          {touched.contactNumber && errors.contactNumber && <p className="text-xs text-red-600 mt-1">{errors.contactNumber}</p>}
          {touched.contactNumber && !errors.contactNumber && formData.contactNumber && <p className="text-xs text-green-600 mt-1">✓</p>}
        </div>

        {/* Location with Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location (Resource) *
            <span className="text-gray-500 font-normal ml-1">- Start typing to search</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <Search size={18} />
            </div>
            <input
              ref={locationInputRef}
              type="text"
              name="location"
              value={formData.location}
              onChange={handleLocationChange}
              onBlur={handleLocationBlur}
              onFocus={() => formData.location && setShowLocationSuggestions(true)}
              placeholder="e.g., LAB-101, Building A, Floor 2"
              disabled={isLoading || resourcesLoading}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                touched.location && errors.location ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300'
              } disabled:bg-gray-100`}
            />
          </div>

          {/* Location Suggestions Dropdown */}
          {showLocationSuggestions && filteredResources.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredResources.map((resource) => (
                <button
                  key={resource.id}
                  type="button"
                  onClick={() => handleSelectResource(resource)}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-gray-100 last:border-b-0 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{resource.hallName}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {resource.buildingName}, Block {resource.blockName}, Floor {resource.floorNumber}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Capacity: {resource.capacity} people • Type: {resource.resourceType}
                      </p>
                    </div>
                    <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showLocationSuggestions && formData.location && filteredResources.length === 0 && !resourcesLoading && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
              <p className="text-sm text-gray-600">No matching locations found. You can still use your custom text.</p>
            </div>
          )}

          {/* Selected Resource Info Card */}
          {selectedResource && (
            <div className="mt-3 rounded-lg border-2 border-green-200 bg-green-50 p-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Selected Location</p>
                    <p className="mt-1 font-semibold text-gray-900">{selectedResource.hallName}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    {selectedResource.resourceType}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-green-200 pt-2">
                  <div>
                    <p className="text-xs text-green-600">Building</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedResource.buildingName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600">Capacity</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedResource.capacity} people</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
        </div>

        {/* Preferred Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Contact Email *</label>
          <p className="text-xs text-gray-500 mb-2">
            Your login email is used as the primary contact email. Changes must be made through your account settings.
          </p>
          <input
            type="email"
            name="preferredContact"
            value={formData.preferredContact}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:outline-none cursor-not-allowed"
          />
        </div>

        {/* Attachments */}
        <AttachmentUploader onFilesSelected={handleFilesSelected} disabled={isLoading} />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {isLoading ? 'Creating Ticket...' : 'Create Ticket'}
        </button>
      </form>
    </div>
  )
}

export default CreateTicketForm
