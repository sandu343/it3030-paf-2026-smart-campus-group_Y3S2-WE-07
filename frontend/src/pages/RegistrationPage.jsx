import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { register, isValidCampusEmail } from '../services/authService';

const FACULTIES = [
  { value: 'COMPUTING', label: 'Faculty of Computing', prefix: 'IT' },
  { value: 'ENGINEERING', label: 'Faculty of Engineering', prefix: 'EN' },
  { value: 'BUSINESS', label: 'Faculty of Business', prefix: 'BM' },
  { value: 'HUMANITIES', label: 'Faculty of Humanities & Sciences', prefix: 'HM' },
  { value: 'GRADUATE', label: 'Faculty of Graduate Studies', prefix: 'GS' },
  { value: 'ARCHITECTURE', label: 'School of Architecture', prefix: 'AR' },
  { value: 'LAW', label: 'School of Law', prefix: 'LW' },
  { value: 'HOSPITALITY', label: 'School of Hospitality', prefix: 'HS' },
  { value: 'FOUNDATION', label: 'Foundation Programme', prefix: 'FD' },
];

const RegistrationPage = () => {
  const [name, setName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const selectedFaculty = useMemo(
    () => FACULTIES.find((item) => item.value === faculty),
    [faculty]
  );

  useEffect(() => {
    if (!selectedFaculty) {
      return;
    }

    const currentDigits = studentId.replace(/[^0-9]/g, '').slice(0, 8);
    const nextStudentId = `${selectedFaculty.prefix}${currentDigits}`;
    setStudentId(nextStudentId);
  }, [selectedFaculty]);

  useEffect(() => {
    if (studentId.length === 10) {
      const generatedEmail = `${studentId.toUpperCase()}@my.sliit.lk`;
      setEmail(generatedEmail);
      if (!isValidCampusEmail(generatedEmail)) {
        setEmailError('Generated ID is not in valid campus format');
      } else {
        setEmailError('');
      }
      return;
    }

    setEmail('');
  }, [studentId]);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return 'Password must contain at least one special character';
    }
    return '';
  };

  const validationErrors = {
    name: name.trim() ? '' : 'Full name is required',
    faculty: faculty ? '' : 'Please select your faculty',
    studentId: /^[A-Z]{2}\d{8}$/.test(studentId) ? '' : 'Student ID must be in format XX12345678',
    phone: /^\d{10}$/.test(phone) ? '' : 'Please enter a valid 10-digit phone number',
    email: !email
      ? 'Campus email will be generated after valid student ID'
      : isValidCampusEmail(email)
        ? ''
        : 'Generated campus email is not valid',
    password: validatePassword(password),
    confirmPassword:
      confirmPassword.length > 0 && password === confirmPassword
        ? ''
        : 'Passwords do not match',
  };

  const isFieldInvalid = (field) => (submitAttempted || touched[field]) && !!validationErrors[field];
  const isFieldValid = (field) => (submitAttempted || touched[field]) && !validationErrors[field];

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleStudentIdChange = (e) => {
    const rawValue = e.target.value.toUpperCase();
    const digits = rawValue.replace(/[^0-9]/g, '').slice(0, 8);

    if (selectedFaculty) {
      setStudentId(`${selectedFaculty.prefix}${digits}`);
      return;
    }

    const alpha = rawValue.replace(/[^A-Z]/g, '').slice(0, 2);
    setStudentId(`${alpha}${digits}`);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setError('');
    setEmailError('');
    setPasswordError('');

    if (validationErrors.name) {
      setError(validationErrors.name);
      return;
    }

    if (validationErrors.faculty) {
      setError(validationErrors.faculty);
      return;
    }

    if (validationErrors.phone) {
      setError(validationErrors.phone);
      return;
    }

    if (validationErrors.studentId) {
      setError(validationErrors.studentId);
      return;
    }

    // Validate email format
    if (validationErrors.email) {
      setEmailError('Please enter a valid campus email (e.g., IT12345678@my.sliit.lk)');
      return;
    }

    // Validate password
    if (validationErrors.password) {
      setPasswordError(validationErrors.password);
      return;
    }

    // Validate password confirmation
    if (validationErrors.confirmPassword) {
      setError(validationErrors.confirmPassword);
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password, phone);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page auth-glass-page">
      <div className="glass-card registration-glass-card">
        <div className="registration-logo-wrap">
          <img
            src="/sliit-campus-logo-.png"
            alt="SLIIT Logo"
            className="registration-logo"
          />
        </div>

        <h1 className="glass-title">Smart Campus</h1>
        <p className="glass-subtitle">Operations Hub</p>
        <p className="glass-caption">Create your account to access your workspace</p>

        {error && (
          <div className="glass-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-form registration-glass-form">
          <div className="glass-field registration-glass-field">
            <label htmlFor="name" className={`glass-label ${isFieldInvalid('name') ? 'glass-label-error' : ''}`}>FULL NAME</label>
            <div className="glass-input-wrap">
              <span className="glass-input-icon" aria-hidden="true">👤</span>
              <input
                type="text"
                id="name"
                className={`glass-input ${isFieldInvalid('name') ? 'glass-input-invalid' : ''} ${isFieldValid('name') ? 'glass-input-valid' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => markTouched('name')}
                placeholder="Enter your full name"
                required
              />
            </div>
            {isFieldInvalid('name') && <span className="glass-field-feedback">{validationErrors.name}</span>}
          </div>

          <div className="glass-field registration-glass-field">
            <label htmlFor="faculty" className={`glass-label ${isFieldInvalid('faculty') ? 'glass-label-error' : ''}`}>FACULTY</label>
            <div className="glass-input-wrap">
              <span className="glass-input-icon" aria-hidden="true">🎓</span>
              <select
                id="faculty"
                className={`glass-input glass-select ${isFieldInvalid('faculty') ? 'glass-input-invalid' : ''} ${isFieldValid('faculty') ? 'glass-input-valid' : ''}`}
                value={faculty}
                onChange={(e) => {
                  setFaculty(e.target.value);
                  if (submitAttempted || touched.faculty) {
                    setError('');
                  }
                }}
                onBlur={() => markTouched('faculty')}
                required
              >
                <option value="">Select your faculty</option>
                {FACULTIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <span className="glass-select-chevron" aria-hidden="true">▾</span>
            </div>
            {isFieldInvalid('faculty') && <span className="glass-field-feedback">{validationErrors.faculty}</span>}
          </div>

          <div className="glass-field registration-glass-field">
            <label htmlFor="studentId" className={`glass-label ${isFieldInvalid('studentId') ? 'glass-label-error' : ''}`}>STUDENT ID</label>
            <div className="glass-input-wrap">
              <span className="glass-input-icon" aria-hidden="true">🪪</span>
              <input
                type="text"
                id="studentId"
                className={`glass-input ${isFieldInvalid('studentId') ? 'glass-input-invalid' : ''} ${isFieldValid('studentId') ? 'glass-input-valid' : ''}`}
                value={studentId}
                onChange={handleStudentIdChange}
                onBlur={() => markTouched('studentId')}
                placeholder={selectedFaculty ? `${selectedFaculty.prefix}12345678` : 'IT12345678'}
                required
              />
            </div>
            <span className="glass-legal-text registration-hint-text">
              Faculty prefix auto-applies. Enter remaining 8 digits.
            </span>
            {isFieldInvalid('studentId') && <span className="glass-field-feedback">{validationErrors.studentId}</span>}
          </div>

          <div className="glass-field registration-glass-field">
            <label htmlFor="phone" className={`glass-label ${isFieldInvalid('phone') ? 'glass-label-error' : ''}`}>PHONE NUMBER</label>
            <div className="glass-input-wrap">
              <span className="glass-input-icon" aria-hidden="true">📱</span>
              <input
                type="tel"
                id="phone"
                className={`glass-input ${isFieldInvalid('phone') ? 'glass-input-invalid' : ''} ${isFieldValid('phone') ? 'glass-input-valid' : ''}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                onBlur={() => markTouched('phone')}
                placeholder="07XXXXXXXX"
                required
              />
            </div>
            {isFieldInvalid('phone') && <span className="glass-field-feedback">{validationErrors.phone}</span>}
          </div>

          <div className="glass-field registration-glass-field registration-glass-field-full">
            <label htmlFor="email" className={`glass-label ${isFieldInvalid('email') ? 'glass-label-error' : ''}`}>CAMPUS EMAIL (AUTO)</label>
            <div className="glass-input-wrap">
              <span className="glass-input-icon" aria-hidden="true">📧</span>
              <input
                type="email"
                id="email"
                className={`glass-input ${isFieldInvalid('email') ? 'glass-input-invalid' : ''} ${isFieldValid('email') ? 'glass-input-valid' : ''}`}
                value={email}
                placeholder="Generated from student ID"
                readOnly
              />
            </div>
            {(emailError || isFieldInvalid('email')) && (
              <span className="glass-inline-error">{emailError || validationErrors.email}</span>
            )}
          </div>

          <div className="glass-field registration-glass-field">
            <label htmlFor="password" className={`glass-label ${isFieldInvalid('password') ? 'glass-label-error' : ''}`}>PASSWORD</label>
            <div className="glass-input-wrap">
              <span className="glass-input-icon" aria-hidden="true">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`glass-input glass-input-password ${isFieldInvalid('password') ? 'glass-input-invalid' : ''} ${isFieldValid('password') ? 'glass-input-valid' : ''}`}
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => markTouched('password')}
                placeholder="Create a strong password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="glass-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {(passwordError || isFieldInvalid('password')) && (
              <span className="glass-inline-error">{passwordError || validationErrors.password}</span>
            )}
          </div>

          <div className="glass-field registration-glass-field">
            <label htmlFor="confirmPassword" className={`glass-label ${isFieldInvalid('confirmPassword') ? 'glass-label-error' : ''}`}>CONFIRM PASSWORD</label>
            <div className="glass-input-wrap">
              <span className="glass-input-icon" aria-hidden="true">✅</span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className={`glass-input glass-input-password ${isFieldInvalid('confirmPassword') ? 'glass-input-invalid' : ''} ${isFieldValid('confirmPassword') ? 'glass-input-valid' : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => markTouched('confirmPassword')}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="glass-password-toggle"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {isFieldInvalid('confirmPassword') && <span className="glass-field-feedback">{validationErrors.confirmPassword}</span>}
          </div>

          <div className="registration-glass-field-full">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="glass-footer-text">
          Already have an account? <Link to="/login" className="glass-teal-link">Sign in</Link>
        </p>

        <p className="glass-legal-text">
          By creating an account, you agree to the Smart Campus terms of use and privacy policy.
        </p>
      </div>
    </div>
  );
};

export default RegistrationPage;
