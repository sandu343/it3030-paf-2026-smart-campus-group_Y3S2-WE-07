export const VALIDATION_RULES = {
  TICKET: {
    title: {
      required: true,
      minLength: 5,
      maxLength: 100,
      errorMessages: {
        required: 'Title is required',
        minLength: 'Title must be at least 5 characters',
        maxLength: 'Title cannot exceed 100 characters'
      }
    },
    description: {
      required: true,
      minLength: 15,
      maxLength: 1000,
      errorMessages: {
        required: 'Description is required',
        minLength: 'Description must be at least 15 characters',
        maxLength: 'Description cannot exceed 1000 characters'
      }
    },
    priority: {
      required: true,
      allowed: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      errorMessages: {
        required: 'Priority is required',
        invalid: 'Please select a valid priority level'
      }
    },
    category: {
      required: true,
      errorMessages: {
        required: 'Category is required',
        invalid: 'Please select a valid category'
      }
    },
    contactNumber: {
      required: true,
      minLength: 9,
      maxLength: 20,
      pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
      errorMessages: {
        required: 'Contact number is required',
        minLength: 'Contact number must be at least 9 digits',
        maxLength: 'Contact number cannot exceed 20 characters',
        invalid: 'Please enter a valid phone number (e.g., 0712345678 or +94712345678 or 077-1234567)'
      }
    },
    location: {
      required: true,
      minLength: 3,
      errorMessages: {
        required: 'Location is required',
        minLength: 'Location must be at least 3 characters',
        invalid: 'Invalid location'
      }
    },
    preferredContact: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$|^(\+?1)?(\d{3})?[-.\s]?\d{3}[-.\s]?\d{4}$/,
      errorMessages: {
        required: 'Preferred contact (email or phone) is required',
        invalid: 'Please enter a valid email or phone number'
      }
    }
  },
  COMMENT: {
    message: {
      required: true,
      minLength: 2,
      maxLength: 500,
      errorMessages: {
        required: 'Comment message cannot be empty',
        minLength: 'Comment must be at least 2 characters',
        maxLength: 'Comment cannot exceed 500 characters'
      }
    }
  },
  ATTACHMENT: {
    maxFiles: 3,
    maxFileSize: 5242880, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/jpg'],
    allowedExtensions: ['.jpg', '.jpeg', '.png'],
    errorMessages: {
      maxFiles: 'Maximum 3 attachments allowed',
      maxFileSize: 'File size must not exceed 5MB',
      invalidFormat: 'Only JPG, JPEG, and PNG images are allowed',
      emptyFile: 'File is empty, please select a valid file'
    }
  }
}

// Predefined ticket categories (must match frontend)
export const TICKET_CATEGORIES = [
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

export const validateField = (fieldName, value) => {
  const rules = VALIDATION_RULES.TICKET
  const fieldRules = rules[fieldName]
  
  if (!fieldRules) {
    return null // No validation rules for this field
  }

  // Title validation
  if (fieldName === 'title') {
    if (!value || !value.trim()) {
      return fieldRules.errorMessages.required
    }
    if (value.trim().length < fieldRules.minLength) {
      return fieldRules.errorMessages.minLength
    }
    if (value.length > fieldRules.maxLength) {
      return fieldRules.errorMessages.maxLength
    }
    return null
  }

  // Description validation
  if (fieldName === 'description') {
    if (!value || !value.trim()) {
      return fieldRules.errorMessages.required
    }
    if (value.trim().length < fieldRules.minLength) {
      return fieldRules.errorMessages.minLength
    }
    if (value.length > fieldRules.maxLength) {
      return fieldRules.errorMessages.maxLength
    }
    return null
  }

  // Priority validation
  if (fieldName === 'priority') {
    if (!value) {
      return fieldRules.errorMessages.required
    }
    if (!fieldRules.allowed.includes(value)) {
      return fieldRules.errorMessages.invalid
    }
    return null
  }

  // Category validation
  if (fieldName === 'category') {
    if (!value || !value.trim()) {
      return fieldRules.errorMessages.required
    }
    if (!TICKET_CATEGORIES.includes(value)) {
      return fieldRules.errorMessages.invalid
    }
    return null
  }

  // Contact number validation
  if (fieldName === 'contactNumber') {
    if (!value || !value.trim()) {
      return fieldRules.errorMessages.required
    }
    if (value.length < fieldRules.minLength) {
      return fieldRules.errorMessages.minLength
    }
    if (value.length > fieldRules.maxLength) {
      return fieldRules.errorMessages.maxLength
    }
    if (!fieldRules.pattern.test(value)) {
      return fieldRules.errorMessages.invalid
    }
    return null
  }

  // Location validation
  if (fieldName === 'location') {
    if (!value || !value.trim()) {
      return fieldRules.errorMessages.required
    }
    if (value.trim().length < fieldRules.minLength) {
      return fieldRules.errorMessages.minLength
    }
    return null
  }

  // Preferred contact validation
  if (fieldName === 'preferredContact') {
    if (!value || !value.trim()) {
      return rules.preferredContact.errorMessages.required
    }
    if (!rules.preferredContact.pattern.test(value)) {
      return rules.preferredContact.errorMessages.invalid
    }
    return null
  }

  return null
}

export const validateTicketForm = (formData) => {
  const errors = {}
  const rules = VALIDATION_RULES.TICKET

  // Title validation
  if (!formData.title || !formData.title.trim()) {
    errors.title = rules.title.errorMessages.required
  } else if (formData.title.length < rules.title.minLength) {
    errors.title = rules.title.errorMessages.minLength
  } else if (formData.title.length > rules.title.maxLength) {
    errors.title = rules.title.errorMessages.maxLength
  }

  // Description validation
  if (!formData.description || !formData.description.trim()) {
    errors.description = rules.description.errorMessages.required
  } else if (formData.description.length < rules.description.minLength) {
    errors.description = rules.description.errorMessages.minLength
  } else if (formData.description.length > rules.description.maxLength) {
    errors.description = rules.description.errorMessages.maxLength
  }

  // Priority validation
  if (!formData.priority) {
    errors.priority = rules.priority.errorMessages.required
  } else if (!rules.priority.allowed.includes(formData.priority)) {
    errors.priority = rules.priority.errorMessages.invalid
  }

  // Category validation - must be from predefined list
  if (!formData.category || !formData.category.trim()) {
    errors.category = rules.category.errorMessages.required
  } else if (!TICKET_CATEGORIES.includes(formData.category)) {
    errors.category = rules.category.errorMessages.invalid
  }

  // Contact number validation (required)
  if (!formData.contactNumber || !formData.contactNumber.trim()) {
    errors.contactNumber = rules.contactNumber.errorMessages.required
  } else if (formData.contactNumber.length < rules.contactNumber.minLength) {
    errors.contactNumber = rules.contactNumber.errorMessages.minLength
  } else if (formData.contactNumber.length > rules.contactNumber.maxLength) {
    errors.contactNumber = rules.contactNumber.errorMessages.maxLength
  } else if (!rules.contactNumber.pattern.test(formData.contactNumber)) {
    errors.contactNumber = rules.contactNumber.errorMessages.invalid
  }

  // Location validation (required, minimum 3 chars)
  if (!formData.location || !formData.location.trim()) {
    errors.location = rules.location.errorMessages.required
  } else if (formData.location.length < rules.location.minLength) {
    errors.location = rules.location.errorMessages.minLength
  }

  // Preferred contact validation
  if (!formData.preferredContact || !formData.preferredContact.trim()) {
    errors.preferredContact = rules.preferredContact.errorMessages.required
  } else if (!rules.preferredContact.pattern.test(formData.preferredContact)) {
    errors.preferredContact = rules.preferredContact.errorMessages.invalid
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateAttachments = (files) => {
  const errors = []
  const rules = VALIDATION_RULES.ATTACHMENT

  if (!files || files.length === 0) {
    return { isValid: true, errors: [] }
  }

  if (files.length > rules.maxFiles) {
    errors.push({
      type: 'maxFiles',
      message: rules.errorMessages.maxFiles
    })
    return { isValid: false, errors }
  }

  files.forEach((file) => {
    if (file.size > rules.maxFileSize) {
      errors.push({
        type: 'fileSize',
        fileName: file.name,
        message: `${file.name}: ${rules.errorMessages.maxFileSize}`
      })
    }

    if (!rules.allowedFormats.includes(file.type)) {
      errors.push({
        type: 'fileType',
        fileName: file.name,
        message: `${file.name}: ${rules.errorMessages.invalidFormat}`
      })
    }

    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!rules.allowedExtensions.includes(ext)) {
      errors.push({
        type: 'extension',
        fileName: file.name,
        message: `${file.name}: ${rules.errorMessages.invalidExtension}`
      })
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateComment = (message) => {
  const errors = {}
  const rules = VALIDATION_RULES.COMMENT

  if (!message || !message.trim()) {
    errors.message = rules.message.errorMessages.required
  } else if (message.length < rules.message.minLength) {
    errors.message = rules.message.errorMessages.minLength
  } else if (message.length > rules.message.maxLength) {
    errors.message = rules.message.errorMessages.maxLength
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
