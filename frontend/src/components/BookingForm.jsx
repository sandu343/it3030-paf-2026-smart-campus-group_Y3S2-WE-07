import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContextObject';
import bookingService from '../services/bookingService';

/**
 * BookingForm Component
 * 
 * Allows users to create a new resource booking with full Tailwind UI styling.
 * 
 * Features:
 * - Resource dropdown (fetches from backend REST API)
 * - Date and time selection with validation
 * - Conflict detection with smart slot suggestions
 * - Comprehensive form validation
 * - Real-time error feedback
 * - Loading states and success/error notifications
 * - Responsive design with Tailwind CSS
 */
const BookingForm = ({ onBookingCreated, onCancel, preselectedResourceId = '' }) => {
  useAuth();
  const [resources, setResources] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [buildingTouched, setBuildingTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedPeriods, setBookedPeriods] = useState([]);
  const [showSlotSuggestions, setShowSlotSuggestions] = useState(false);
  const [slotRange, setSlotRange] = useState({
    fromTime: '08:00',
    toTime: '18:00',
  });

  const [formData, setFormData] = useState({
    resourceId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: 1,
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [conflictError, setConflictError] = useState(false);
  const [slotRangeOverlapError, setSlotRangeOverlapError] = useState('');

  const getBuildingKey = (resource) => {
    return resource?.buildingId || resource?.buildingName || 'UNKNOWN_BUILDING';
  };

  const getBuildingLabel = (resource) => {
    return resource?.buildingName || resource?.buildingId || 'Unknown Building';
  };

  const buildingOptions = resources.reduce((accumulator, resource) => {
    const key = getBuildingKey(resource);
    if (!accumulator.some((option) => option.value === key)) {
      accumulator.push({
        value: key,
        label: getBuildingLabel(resource),
      });
    }
    return accumulator;
  }, []).sort((left, right) => left.label.localeCompare(right.label));

  const buildingMeetingRooms = selectedBuilding
    ? resources.filter((resource) => getBuildingKey(resource) === selectedBuilding)
    : [];

  // Fetch resources on component mount
  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoading(true);
        const data = await bookingService.fetchResources({ resourceType: 'MEETING_ROOM' });
        const safeResources = Array.isArray(data) ? data : [];
        const sortedResources = [...safeResources].sort((left, right) => {
          const leftBuilding = String(getBuildingLabel(left)).toLowerCase();
          const rightBuilding = String(getBuildingLabel(right)).toLowerCase();
          if (leftBuilding !== rightBuilding) {
            return leftBuilding.localeCompare(rightBuilding);
          }

          const leftName = String(left.hallName || '').toLowerCase();
          const rightName = String(right.hallName || '').toLowerCase();
          return leftName.localeCompare(rightName);
        });

        setResources(sortedResources);
      } catch (err) {
        setError('Failed to load meeting rooms. Please try again later.');
        console.error('Error loading resources:', err);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);

  useEffect(() => {
    if (!preselectedResourceId || resources.length === 0) {
      return;
    }

    const existsInList = resources.some((resource) => resource.id === preselectedResourceId);
    if (!existsInList) {
      return;
    }

    const preselectedResource = resources.find((resource) => resource.id === preselectedResourceId);
    if (preselectedResource) {
      setSelectedBuilding(getBuildingKey(preselectedResource));
    }

    setFormData((previousData) => {
      if (previousData.resourceId === preselectedResourceId) {
        return previousData;
      }

      return {
        ...previousData,
        resourceId: preselectedResourceId,
      };
    });

    setTouched((previousTouched) => ({
      ...previousTouched,
      resourceId: true,
    }));
  }, [preselectedResourceId, resources]);

  useEffect(() => {
    if (!selectedBuilding || !formData.resourceId) {
      return;
    }

    const selectedRoom = resources.find((resource) => resource.id === formData.resourceId);
    if (!selectedRoom || getBuildingKey(selectedRoom) !== selectedBuilding) {
      setFormData((previousData) => ({
        ...previousData,
        resourceId: '',
        startTime: '',
        endTime: '',
      }));
    }
  }, [selectedBuilding, formData.resourceId, resources]);

  // Fetch available slots when date and resource change
  useEffect(() => {
    if (formData.resourceId && formData.date) {
      if (slotRange.fromTime >= slotRange.toTime) {
        setAvailableSlots([]);
        return;
      }

      const loadAvailableSlots = async () => {
        try {
          const slots = await bookingService.getAvailableSlots(
            formData.resourceId,
            formData.date,
            50,
            slotRange.fromTime,
            slotRange.toTime
          );
          setAvailableSlots(slots);

          if (slots.length === 0) {
            setFormData((prev) => ({
              ...prev,
              startTime: '',
              endTime: '',
            }));
            setConflictError(true);
            setError('Selected time range is fully booked. Please choose a different range.');
            return;
          }

          if (error === 'Selected time range is fully booked. Please choose a different range.') {
            setError('');
          }
          setConflictError(false);

          const hasCurrentSelection = slots.some(
            (slot) =>
              slot.startTime === formData.startTime && slot.endTime === formData.endTime
          );

          if (slots.length > 0 && !hasCurrentSelection) {
            const firstSlot = slots[0];
            setFormData((prev) => ({
              ...prev,
              startTime: firstSlot.startTime,
              endTime: firstSlot.endTime,
            }));
          } else if (!hasCurrentSelection) {
            setFormData((prev) => ({
              ...prev,
              startTime: '',
              endTime: '',
            }));
          }
        } catch (err) {
          console.error('Error fetching available slots:', err);
          setAvailableSlots([]);
        }
      };

      loadAvailableSlots();

      const loadBookedPeriods = async () => {
        try {
          const bookings = await bookingService.getResourceBookings(formData.resourceId);
          const activeBookings = (bookings || []).filter(
            (booking) =>
              booking.date === formData.date &&
              (booking.status === 'PENDING' || booking.status === 'APPROVED')
          );
          setBookedPeriods(activeBookings);
        } catch (err) {
          console.error('Error fetching booked periods:', err);
          setBookedPeriods([]);
        }
      };

      loadBookedPeriods();
    } else {
      setAvailableSlots([]);
      setBookedPeriods([]);
    }
  }, [
    formData.resourceId,
    formData.date,
    formData.startTime,
    formData.endTime,
    slotRange.fromTime,
    slotRange.toTime,
    error,
  ]);

  /**
   * Comprehensive real-time validation for all form fields
   * Validates:
   * - Required fields
   * - Date constraints (not in past)
   * - Time constraints (working hours 08:00-18:00)
   * - Time logic (end time after start time)
   * - Duration constraint (minimum 30 minutes)
   * - Purpose length (3-100 characters)
   * - Attendees count (1-1000)
   * - Capacity constraint (attendees vs resource capacity)
   */
  const validateField = useCallback((name, value, currentFormData) => {
    const fieldErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (name) {
      case 'resourceId':
        if (!value) {
          fieldErrors[name] = 'Please select a resource';
        }
        break;

      case 'date':
        if (!value) {
          fieldErrors[name] = 'Please select a date';
        } else if (new Date(value) < today) {
          fieldErrors[name] = 'Cannot book in the past';
        }
        break;

      case 'startTime':
        if (!value) {
          fieldErrors[name] = 'Start time is required';
        } else if (value < '08:00') {
          fieldErrors[name] = 'Start time must be at or after 08:00 AM';
        } else if (value > '18:00') {
          fieldErrors[name] = 'Start time must be at or before 06:00 PM';
        }
        // Check if end time exists and validate duration
        if (currentFormData.endTime && value >= currentFormData.endTime) {
          fieldErrors[name] = 'Start time must be before end time';
        }
        // Check minimum duration
        if (currentFormData.endTime && value) {
          const [startHour, startMin] = value.split(':');
          const [endHour, endMin] = currentFormData.endTime.split(':');
          const startTotalMin = parseInt(startHour) * 60 + parseInt(startMin);
          const endTotalMin = parseInt(endHour) * 60 + parseInt(endMin);
          const duration = endTotalMin - startTotalMin;
          if (duration < 30 && duration > 0) {
            fieldErrors[name] = 'Minimum booking duration is 30 minutes';
          }
        }
        break;

      case 'endTime':
        if (!value) {
          fieldErrors[name] = 'End time is required';
        } else if (value > '18:00') {
          fieldErrors[name] = 'End time must be at or before 06:00 PM';
        } else if (value < '08:00') {
          fieldErrors[name] = 'End time must be at or after 08:00 AM';
        }
        // Check against start time
        if (currentFormData.startTime) {
          if (value <= currentFormData.startTime) {
            fieldErrors[name] = 'End time must be after start time';
          }
          // Check minimum duration
          const [startHour, startMin] = currentFormData.startTime.split(':');
          const [endHour, endMin] = value.split(':');
          const startTotalMin = parseInt(startHour) * 60 + parseInt(startMin);
          const endTotalMin = parseInt(endHour) * 60 + parseInt(endMin);
          const duration = endTotalMin - startTotalMin;
          if (duration < 30) {
            fieldErrors[name] = 'Minimum booking duration is 30 minutes';
          }
        }
        break;

      case 'purpose':
        if (!value || value.trim().length === 0) {
          fieldErrors[name] = 'Purpose is required';
        } else if (value.trim().length < 3) {
          fieldErrors[name] = 'Purpose must be at least 3 characters';
        } else if (value.length > 100) {
          fieldErrors[name] = 'Purpose must not exceed 100 characters';
        }
        break;

      case 'attendees': {
        const attendeeNum = parseInt(value);
        if (!value) {
          fieldErrors[name] = 'Number of attendees is required';
        } else if (isNaN(attendeeNum) || attendeeNum < 1) {
          fieldErrors[name] = 'Must have at least 1 attendee';
        } else if (attendeeNum > 1000) {
          fieldErrors[name] = 'Attendees cannot exceed 1000';
        }
        // Check capacity
        const selectedResource = resources.find((r) => r.id === currentFormData.resourceId);
        if (selectedResource && attendeeNum > selectedResource.capacity) {
          fieldErrors[name] = `Exceeds resource capacity (${selectedResource.capacity} max)`;
        }
        break;
      }

      default:
        break;
    }

    return fieldErrors;
  }, [resources]);

  // Real-time validation on form data change
  const validateFormData = useCallback((data) => {
    const newErrors = {};

    // Validate all fields
    Object.keys(data).forEach((key) => {
      const fieldErrors = validateField(key, data[key], data);
      Object.assign(newErrors, fieldErrors);
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validateField]);

  // Validate form whenever formData changes
  useEffect(() => {
    validateFormData(formData);
  }, [formData, validateFormData]);

  // Handle input changes with real-time error clearing
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const handleBuildingChange = (e) => {
    const nextBuilding = e.target.value;
    setSelectedBuilding(nextBuilding);
    setBuildingTouched(true);
    setFormData((previousData) => ({
      ...previousData,
      resourceId: '',
      startTime: '',
      endTime: '',
    }));
    setTouched((previousTouched) => ({
      ...previousTouched,
      resourceId: true,
    }));
  };

  // Check if custom slot range overlaps with any booked periods
  const checkSlotRangeOverlap = useCallback(() => {
    if (bookedPeriods.length === 0 || slotRange.fromTime >= slotRange.toTime) {
      return '';
    }

    const [rangeStartHour, rangeStartMin] = slotRange.fromTime.split(':');
    const [rangeEndHour, rangeEndMin] = slotRange.toTime.split(':');
    const rangeStartTotalMin = parseInt(rangeStartHour) * 60 + parseInt(rangeStartMin);
    const rangeEndTotalMin = parseInt(rangeEndHour) * 60 + parseInt(rangeEndMin);

    for (let i = 0; i < bookedPeriods.length; i++) {
      const booking = bookedPeriods[i];
      const [bookedStartHour, bookedStartMin] = booking.startTime.split(':');
      const [bookedEndHour, bookedEndMin] = booking.endTime.split(':');
      const bookedStartTotalMin = parseInt(bookedStartHour) * 60 + parseInt(bookedStartMin);
      const bookedEndTotalMin = parseInt(bookedEndHour) * 60 + parseInt(bookedEndMin);

      // Check if ranges overlap: range start < booked end AND range end > booked start
      if (rangeStartTotalMin < bookedEndTotalMin && rangeEndTotalMin > bookedStartTotalMin) {
        return `Some times in the selected range (${slotRange.fromTime} - ${slotRange.toTime}) are already booked.`;
      }
    }

    return '';
  }, [slotRange.fromTime, slotRange.toTime, bookedPeriods]);

  // Update range overlap error in real-time
  useEffect(() => {
    const overlapError = checkSlotRangeOverlap();
    setSlotRangeOverlapError(overlapError);
  }, [checkSlotRangeOverlap]);

  // Check if selected time overlaps with any booked periods
  const hasTimeOverlapWithBooked = useCallback(() => {
    if (
      !formData.startTime ||
      !formData.endTime ||
      bookedPeriods.length === 0
    ) {
      return false;
    }

    const [selStartHour, selStartMin] = formData.startTime.split(':');
    const [selEndHour, selEndMin] = formData.endTime.split(':');
    const selStartTotalMin = parseInt(selStartHour) * 60 + parseInt(selStartMin);
    const selEndTotalMin = parseInt(selEndHour) * 60 + parseInt(selEndMin);

    for (let i = 0; i < bookedPeriods.length; i++) {
      const booking = bookedPeriods[i];
      const [bookedStartHour, bookedStartMin] = booking.startTime.split(':');
      const [bookedEndHour, bookedEndMin] = booking.endTime.split(':');
      const bookedStartTotalMin = parseInt(bookedStartHour) * 60 + parseInt(bookedStartMin);
      const bookedEndTotalMin = parseInt(bookedEndHour) * 60 + parseInt(bookedEndMin);

      // Check if ranges overlap: selected start < booked end AND selected end > booked start
      if (selStartTotalMin < bookedEndTotalMin && selEndTotalMin > bookedStartTotalMin) {
        return true;
      }
    }

    return false;
  }, [formData.startTime, formData.endTime, bookedPeriods]);

  // Handle slot suggestion selection
  const handleSelectSlot = (slot) => {
    setFormData((prev) => ({
      ...prev,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
    setShowSlotSuggestions(false);
    setConflictError(false);
    setError('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setError('');
    setSuccess('');

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    setBuildingTouched(true);

    if (!selectedBuilding) {
      setError('Please select a building first.');
      return;
    }

    // Validate form one final time
    if (!validateFormData(formData)) {
      setError('Please fix all errors before submitting');
      return;
    }

    if (
      formData.resourceId &&
      formData.date &&
      slotRange.fromTime < slotRange.toTime &&
      availableSlots.length === 0
    ) {
      setConflictError(true);
      setError('Selected time range is fully booked. Please choose a different range.');
      return;
    }

    // Check if selected time overlaps with booked periods
    if (hasTimeOverlapWithBooked()) {
      setConflictError(true);
      setError(
        `Selected time ${formData.startTime} - ${formData.endTime} overlaps with an already booked period. Please choose a different time.`
      );
      return;
    }

    try {
      setLoading(true);
      const response = await bookingService.createBooking(formData);
      
      setSuccess('Booking created successfully! You can view it in your dashboard.');
      
      // Reset form
      setFormData({
        resourceId: '',
        date: '',
        startTime: '',
        endTime: '',
        purpose: '',
        attendees: 1,
        notes: '',
      });
      setSelectedBuilding('');
      setBuildingTouched(false);
      setTouched({});
      setHasAttemptedSubmit(false);

      // Call parent callback
      if (onBookingCreated) {
        onBookingCreated(response);
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create booking';
      const isConflictError = err.response?.status === 409 || errorMessage.toLowerCase().includes('conflict');
      
      setError(errorMessage);
      console.error('Booking creation error:', err);

      // If conflict detected, fetch available slots automatically
      if (isConflictError && formData.resourceId && formData.date) {
        setConflictError(true);
        try {
          const slots = await bookingService.getAvailableSlots(
            formData.resourceId,
            formData.date,
            50,
            slotRange.fromTime,
            slotRange.toTime
          );
          setAvailableSlots(slots);
        } catch (slotErr) {
          console.error('Error fetching available slots:', slotErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if form is valid and no time overlap with booked periods
  const isFormValid = Object.keys(errors).length === 0 &&
    selectedBuilding &&
    formData.resourceId &&
    formData.date &&
    formData.startTime &&
    formData.endTime &&
    formData.purpose.trim().length >= 3 &&
    formData.attendees >= 1 &&
    !hasTimeOverlapWithBooked();

  // Get selected resource for info display
  const selectedResource = resources.find((r) => r.id === formData.resourceId);
  const shouldShowFieldError = (fieldName) => hasAttemptedSubmit || touched[fieldName];
  const shouldShowBuildingError = hasAttemptedSubmit || buildingTouched;

  return (
    <div className="py-2">
      <div className="mx-auto max-w-3xl">
        {/* Form Container */}
        <div className="rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
          <div className="px-6 py-8 sm:px-8">
            {/* Error Alert */}
            {error && (
              <div className={`mb-6 rounded-lg border p-4 animate-in fade-in-0 duration-200 ${
                conflictError
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className={`h-5 w-5 ${
                      conflictError ? 'text-orange-400' : 'text-red-400'
                    }`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      conflictError
                        ? 'text-orange-800'
                        : 'text-red-800'
                    }`}>{error}</p>
                    {conflictError && (
                      <p className="mt-1 text-xs text-orange-700">
                        Don't worry! Check out the available time slots below.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Conflict Suggestions - Only show when conflict error and suggestions available */}
            {conflictError && availableSlots.length > 0 && (
              <div className="mb-6 rounded-lg border-2 border-orange-300 bg-orange-50 p-5 animate-in fade-in-0 duration-300">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-orange-900">
                      We found {availableSlots.length} available time slot{availableSlots.length > 1 ? 's' : ''} on {formData.date}.
                    </h3>
                    <p className="mt-1 text-xs text-orange-700">
                      Click any time slot below to instantly update your booking request.
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectSlot(slot)}
                      className="group rounded-lg border-2 border-orange-300 bg-white px-4 py-3 text-left text-sm font-semibold text-orange-900 transition-all hover:border-orange-500 hover:bg-orange-100 active:bg-orange-200 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-base font-bold">{slot.startTime} - {slot.endTime}</span>
                          <span className="text-xs text-orange-700">Click to select</span>
                        </div>
                        <svg className="h-5 w-5 text-orange-400 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 animate-in fade-in-0 duration-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-emerald-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                Fields marked with <span className="text-red-600">*</span> are required.
              </p>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Resource Selection */}
                <div>
                <label htmlFor="building" className="block text-sm font-semibold text-gray-900">
                  Select Building <span className="text-red-500">*</span>
                </label>
                <p className="mt-1 text-xs text-gray-600">Choose the building that has your meeting room</p>
                <select
                  id="building"
                  name="building"
                  value={selectedBuilding}
                  onChange={handleBuildingChange}
                  disabled={loading}
                  className={`mt-2 block w-full rounded-2xl border-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 ${
                    shouldShowBuildingError && !selectedBuilding
                      ? 'border-red-300 bg-red-50 text-gray-900'
                      : 'border-slate-200 bg-white text-gray-900 hover:border-blue-200'
                  } ${loading ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <option value="">-- Select a Building --</option>
                  {buildingOptions.map((building) => (
                    <option key={building.value} value={building.value}>
                      {building.label}
                    </option>
                  ))}
                </select>
                {shouldShowBuildingError && !selectedBuilding && (
                  <p className="mt-2 text-sm font-medium text-red-600">Please select a building</p>
                )}
                </div>

              <div>
                <label htmlFor="resourceId" className="block text-sm font-semibold text-gray-900">
                  Select Meeting Room <span className="text-red-500">*</span>
                </label>
                <p className="mt-1 text-xs text-gray-600">Choose a meeting room from the selected building</p>
                <select
                  id="resourceId"
                  name="resourceId"
                  value={formData.resourceId}
                  onChange={handleChange}
                  disabled={loading || !selectedBuilding}
                  className={`mt-2 block w-full rounded-2xl border-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 ${
                    shouldShowFieldError('resourceId') && errors.resourceId
                      ? 'border-red-300 bg-red-50 text-gray-900'
                      : 'border-slate-200 bg-white text-gray-900 hover:border-blue-200'
                  } ${loading || !selectedBuilding ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <option value="">{selectedBuilding ? '-- Select a Meeting Room --' : '-- Select Building First --'}</option>
                  {buildingMeetingRooms.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.hallName} (Capacity: {resource.capacity} people)
                    </option>
                  ))}
                </select>
                {shouldShowFieldError('resourceId') && errors.resourceId && (
                  <p className="mt-2 flex items-center text-sm font-medium text-red-600">
                    <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18.101 12.93l-.902-14.85a1.5 1.5 0 00-1.528-1.393H4.329a1.5 1.5 0 00-1.529 1.393L1.899 12.93A3 3 0 104.743 19h10.514a3 3 0 00-2.857-6.07z" clipRule="evenodd" />
                    </svg>
                    {errors.resourceId}
                  </p>
                )}

                {/* Resource Info Card */}
                {selectedResource && (
                  <div className="mt-4 rounded-2xl border-2 border-blue-200 bg-blue-50/70 p-4">
                    <div className="grid gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#3B82F6]">Resource Details</p>
                          <p className="mt-1 text-lg font-bold text-gray-900">{selectedResource.hallName}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-[#1E3A8A]">
                          {selectedResource.resourceType}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 border-t border-blue-200 pt-3">
                        <div>
                          <p className="text-xs text-[#3B82F6]">Capacity</p>
                          <p className="text-sm font-bold text-gray-900">{selectedResource.capacity} people</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#3B82F6]">Location</p>
                          <p className="text-sm font-bold text-gray-900">
                            {selectedResource.buildingName}, Block {selectedResource.blockName}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-[#3B82F6]">Floor</p>
                          <p className="text-sm font-bold text-gray-900">Floor {selectedResource.floorNumber}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-gray-900">
                  Booking Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`mt-2 block w-full rounded-2xl border-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 ${
                    shouldShowFieldError('date') && errors.date
                      ? 'border-red-300 bg-red-50 text-gray-900'
                      : 'border-slate-200 bg-white text-gray-900'
                  }`}
                />
                {shouldShowFieldError('date') && errors.date && (
                  <p className="mt-2 flex items-center text-sm font-medium text-red-600">
                    <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18.101 12.93l-.902-14.85a1.5 1.5 0 00-1.528-1.393H4.329a1.5 1.5 0 00-1.529 1.393L1.899 12.93A3 3 0 104.743 19h10.514a3 3 0 00-2.857-6.07z" clipRule="evenodd" />
                    </svg>
                    {errors.date}
                  </p>
                )}
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-1 gap-6 lg:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-semibold text-gray-900">Customize Slot Range</p>
                  <p className="mt-1 text-xs text-gray-600">
                    Choose a time window. Only available slots inside this range will be shown.
                  </p>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="fromTime" className="block text-xs font-semibold uppercase text-[#1E3A8A]">
                        From
                      </label>
                      <select
                        id="fromTime"
                        value={slotRange.fromTime}
                        onChange={(e) => setSlotRange((prev) => ({ ...prev, fromTime: e.target.value }))}
                        className="mt-1 block w-full rounded-2xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-[#3B82F6] focus:outline-none"
                      >
                        {Array.from({ length: 21 }, (_, index) => {
                          const totalMinutes = 8 * 60 + index * 30;
                          const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
                          const minutes = String(totalMinutes % 60).padStart(2, '0');
                          const timeValue = `${hours}:${minutes}`;
                          return (
                            <option key={`from-${timeValue}`} value={timeValue}>
                              {timeValue}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="toTime" className="block text-xs font-semibold uppercase text-[#1E3A8A]">
                        To
                      </label>
                      <select
                        id="toTime"
                        value={slotRange.toTime}
                        onChange={(e) => setSlotRange((prev) => ({ ...prev, toTime: e.target.value }))}
                        className="mt-1 block w-full rounded-2xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-[#3B82F6] focus:outline-none"
                      >
                        {Array.from({ length: 21 }, (_, index) => {
                          const totalMinutes = 8 * 60 + index * 30;
                          const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
                          const minutes = String(totalMinutes % 60).padStart(2, '0');
                          const timeValue = `${hours}:${minutes}`;
                          return (
                            <option key={`to-${timeValue}`} value={timeValue}>
                              {timeValue}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  {slotRange.fromTime >= slotRange.toTime && (
                    <p className="mt-2 text-sm font-medium text-red-600">
                      From time must be before To time.
                    </p>
                  )}

                  {slotRangeOverlapError && (
                    <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
                      <p className="text-sm font-medium text-amber-800">
                        Warning: {slotRangeOverlapError}
                      </p>
                    </div>
                  )}

                  <p className="mt-2 text-xs text-[#1E3A8A]">
                    The first available slot in this range will be auto-selected.
                  </p>
                  {formData.resourceId && formData.date && availableSlots.length === 0 && (
                    <p className="mt-2 text-sm font-medium text-orange-700">
                      No available time slots in the selected range. Please adjust the range or date.
                    </p>
                  )}

                  {formData.resourceId && formData.date && bookedPeriods.length > 0 && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                        Booked Time Periods
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {bookedPeriods.map((booking) => (
                          <span
                            key={`booked-${booking.id}`}
                            className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700"
                          >
                            {booking.startTime} - {booking.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Smart Slot Suggestions */}
              {availableSlots.length > 0 && (
                <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 lg:col-span-2">
                  <button
                    type="button"
                    onClick={() => setShowSlotSuggestions(!showSlotSuggestions)}
                    className="inline-flex items-center text-sm font-semibold text-amber-700 hover:text-amber-900"
                  >
                    <svg className={`mr-2 h-5 w-5 transition-transform ${showSlotSuggestions ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {showSlotSuggestions ? 'Hide' : 'Show'} Suggested Time Slots
                  </button>
                  {showSlotSuggestions && (
                    <div className="mt-4 grid gap-2">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectSlot(slot)}
                          className="rounded-lg border-2 border-amber-300 bg-white px-4 py-3 text-left text-sm font-medium text-amber-900 transition-all hover:border-amber-500 hover:bg-amber-100 active:bg-amber-200"
                        >
                          <span className="font-bold">{slot.startTime}</span>
                          <span className="mx-2 text-gray-500">to</span>
                          <span className="font-bold">{slot.endTime}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Purpose */}
              <div className="lg:col-span-2">
                <label htmlFor="purpose" className="block text-sm font-semibold text-gray-900">
                  Purpose of Booking <span className="text-red-500">*</span>
                </label>
                <p className="mt-1 text-xs text-gray-600">What will this resource be used for?</p>
                <input
                  type="text"
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  placeholder="e.g., Lecture Class, Team Meeting, Research Lab Session"
                  maxLength="100"
                  className={`mt-2 block w-full rounded-2xl border-2 px-4 py-3 text-sm font-medium transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 ${
                    shouldShowFieldError('purpose') && errors.purpose
                      ? 'border-red-300 bg-red-50 text-gray-900'
                      : 'border-slate-200 bg-white text-gray-900'
                  }`}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-gray-500">{formData.purpose.length}/100 characters</p>
                  {shouldShowFieldError('purpose') && errors.purpose && (
                    <p className="flex items-center text-xs font-medium text-red-600">
                      <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18.101 12.93l-.902-14.85a1.5 1.5 0 00-1.528-1.393H4.329a1.5 1.5 0 00-1.529 1.393L1.899 12.93A3 3 0 104.743 19h10.514a3 3 0 00-2.857-6.07z" clipRule="evenodd" />
                      </svg>
                      {errors.purpose}
                    </p>
                  )}
                </div>
              </div>

              {/* Attendees */}
              <div>
                <label htmlFor="attendees" className="block text-sm font-semibold text-gray-900">
                  Number of Attendees <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="attendees"
                  name="attendees"
                  value={formData.attendees}
                  onChange={handleChange}
                  min="1"
                  max="1000"
                  className={`mt-2 block w-full rounded-2xl border-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 ${
                    shouldShowFieldError('attendees') && (errors.attendees || errors.capacity)
                      ? 'border-red-300 bg-red-50 text-gray-900'
                      : 'border-slate-200 bg-white text-gray-900'
                  }`}
                />
                {shouldShowFieldError('attendees') && (errors.attendees || errors.capacity) && (
                  <p className="mt-2 flex items-center text-sm font-medium text-red-600">
                    <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18.101 12.93l-.902-14.85a1.5 1.5 0 00-1.528-1.393H4.329a1.5 1.5 0 00-1.529 1.393L1.899 12.93A3 3 0 104.743 19h10.514a3 3 0 00-2.857-6.07z" clipRule="evenodd" />
                    </svg>
                    {errors.attendees || errors.capacity}
                  </p>
                )}
                {selectedResource && formData.attendees > 0 && (
                  <div className={`mt-3 rounded-lg px-4 py-2 text-sm ${
                    formData.attendees <= selectedResource.capacity
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border border-orange-200 bg-orange-50 text-orange-800'
                  }`}>
                    <p className="font-medium">
                      {formData.attendees <= selectedResource.capacity
                        ? `Fits within capacity (${selectedResource.capacity} people)`
                        : `Exceeds capacity (${selectedResource.capacity} people)`}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="lg:col-span-2">
                <label htmlFor="notes" className="block text-sm font-semibold text-gray-900">
                  Additional Notes <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <p className="mt-1 text-xs text-gray-600">Any special requirements or comments</p>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="E.g., Need projector setup, require accessibility features, dietary requirements..."
                  rows="3"
                  maxLength="500"
                  className="mt-2 block w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
                />
                <p className="mt-1 text-xs text-gray-500">{formData.notes.length}/500 characters</p>
              </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row">
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className={`flex items-center justify-center rounded-lg px-6 py-3 font-semibold transition-all duration-200 ${
                    loading || !isFormValid
                      ? 'cursor-not-allowed bg-gray-400 text-white opacity-75'
                      : 'bg-[#10B981] text-white hover:bg-[#059669] active:bg-[#047857] shadow-md hover:shadow-lg'
                  }`}
                  title={!isFormValid ? 'Please fix validation errors before submitting' : ''}
                >
                  {loading ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Booking
                    </>
                  )}
                </button>
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Validation Summary */}
              {hasAttemptedSubmit && Object.keys(errors).length > 0 && (
                <div className="mt-4 rounded-lg border-2 border-red-200 bg-red-50 p-4">
                  <h3 className="flex items-center text-sm font-semibold text-red-900">
                    <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Please fix the errors below:
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {Object.entries(errors).map(([field, message]) => (
                      <li key={field} className="text-xs text-red-800">{message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </form>

            {/* Info Section */}
            <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
              <h3 className="text-sm font-semibold text-[#1E3A8A]">Booking Information</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-xs text-slate-700">
                <li>Bookings are subject to admin approval</li>
                <li>Working hours: 08:00 AM to 06:00 PM</li>
                <li>Minimum booking duration: 30 minutes</li>
                <li>You can manage your bookings from your dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
