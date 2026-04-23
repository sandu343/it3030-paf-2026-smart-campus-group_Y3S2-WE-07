import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { registerUserAccount, isValidCampusEmail } from '../services/authService';
import { clearSignupPending, sendSignupVerificationCode, verifySignupCode } from '../services/emailService';

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
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
  }, [selectedFaculty, studentId]);

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
    setSuccessMessage('');
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

    if (validationErrors.email) {
      setEmailError('Please enter a valid campus email (e.g., IT12345678@my.sliit.lk)');
      return;
    }

    if (validationErrors.password) {
      setPasswordError(validationErrors.password);
      return;
    }

    if (validationErrors.confirmPassword) {
      setError(validationErrors.confirmPassword);
      return;
    }

    setLoading(true);

    try {
      if (!verificationRequested) {
        await sendSignupVerificationCode({
          itNumber: studentId,
          fullName: name,
          email,
          password,
          phone,
        });
        setVerificationRequested(true);
        setSuccessMessage('Verification code sent to your campus email. Enter the code to complete sign up.');
        return;
      }

      const pendingUser = verifySignupCode({ email, code: verificationCode });
      await registerUserAccount(
        pendingUser.fullName,
        pendingUser.email,
        pendingUser.password,
        pendingUser.phone || ''
      );
      clearSignupPending(pendingUser.email);
      navigate('/login?verified=1');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-shell">
        <section className="register-showcase">
          <div className="register-showcase-image-wrap">
            <img
              src="/login.png"
              alt="Students collaborating in a modern campus study space"
              className="register-showcase-image"
            />
            <div className="register-showcase-overlay" />
          </div>

          <div className="register-showcase-content">
            <div className="login-showcase-chip">Smart Campus Experience</div>

            <div className="register-showcase-copy">
              <p className="login-showcase-eyebrow">Create Your Student Account</p>
              <h1>Get started with Smart Campus in a few quick steps.</h1>
              <p>
                Build your student profile, generate your official campus email, and unlock bookings,
                alerts, and issue reporting from one dashboard.
              </p>
            </div>

            <div className="register-showcase-stats">
              <div className="login-showcase-stat">
                <strong>Student ID</strong>
                <span>Auto-generates your campus email</span>
              </div>
              <div className="login-showcase-stat">
                <strong>Secure</strong>
                <span>Password validation built in</span>
              </div>
              <div className="login-showcase-stat">
                <strong>Instant</strong>
                <span>Move straight into your workspace</span>
              </div>
            </div>
          </div>
        </section>

        <section className="register-panel">
          <div className="register-panel-header">
            <Link to="/login" className="register-back-link">
              <ArrowLeft size={16} />
              Back to login
            </Link>
            <p className="login-panel-kicker">Student Registration</p>
            <h2>Create your Smart Campus account</h2>
            <p className="login-panel-text">Fill in your details to activate your student workspace.</p>
          </div>

          {error && (
            <div className="glass-error" role="alert">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="glass-form register-form-grid">
            <div className="glass-field">
              <label htmlFor="name" className={`glass-label login-label ${isFieldInvalid('name') ? 'glass-label-error' : ''}`}>
                Full name
              </label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  id="name"
                  className={`glass-input login-input ${isFieldInvalid('name') ? 'glass-input-invalid' : ''} ${isFieldValid('name') ? 'glass-input-valid' : ''}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => markTouched('name')}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              {isFieldInvalid('name') && <span className="glass-field-feedback">{validationErrors.name}</span>}
            </div>

            <div className="glass-field">
              <label htmlFor="faculty" className={`glass-label login-label ${isFieldInvalid('faculty') ? 'glass-label-error' : ''}`}>
                Faculty
              </label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <GraduationCap size={18} />
                </span>
                <select
                  id="faculty"
                  className={`glass-input glass-select login-input register-select ${isFieldInvalid('faculty') ? 'glass-input-invalid' : ''} ${isFieldValid('faculty') ? 'glass-input-valid' : ''}`}
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
                <span className="glass-select-chevron register-select-chevron" aria-hidden="true">▾</span>
              </div>
              {isFieldInvalid('faculty') && <span className="glass-field-feedback">{validationErrors.faculty}</span>}
            </div>

            <div className="glass-field">
              <label htmlFor="studentId" className={`glass-label login-label ${isFieldInvalid('studentId') ? 'glass-label-error' : ''}`}>
                Student ID
              </label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <CreditCard size={18} />
                </span>
                <input
                  type="text"
                  id="studentId"
                  className={`glass-input login-input ${isFieldInvalid('studentId') ? 'glass-input-invalid' : ''} ${isFieldValid('studentId') ? 'glass-input-valid' : ''}`}
                  value={studentId}
                  onChange={handleStudentIdChange}
                  onBlur={() => markTouched('studentId')}
                  placeholder={selectedFaculty ? `${selectedFaculty.prefix}12345678` : 'IT12345678'}
                  required
                />
              </div>
              <span className="register-hint-text">Faculty prefix auto-applies. Enter the remaining 8 digits.</span>
              {isFieldInvalid('studentId') && <span className="glass-field-feedback">{validationErrors.studentId}</span>}
            </div>

            <div className="glass-field">
              <label htmlFor="phone" className={`glass-label login-label ${isFieldInvalid('phone') ? 'glass-label-error' : ''}`}>
                Phone number
              </label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <Phone size={18} />
                </span>
                <input
                  type="tel"
                  id="phone"
                  className={`glass-input login-input ${isFieldInvalid('phone') ? 'glass-input-invalid' : ''} ${isFieldValid('phone') ? 'glass-input-valid' : ''}`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  onBlur={() => markTouched('phone')}
                  placeholder="07XXXXXXXX"
                  required
                />
              </div>
              {isFieldInvalid('phone') && <span className="glass-field-feedback">{validationErrors.phone}</span>}
            </div>

            <div className="glass-field register-field-full">
              <label htmlFor="email" className={`glass-label login-label ${isFieldInvalid('email') ? 'glass-label-error' : ''}`}>
                Campus email
              </label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  id="email"
                  className={`glass-input login-input register-readonly-input ${isFieldInvalid('email') ? 'glass-input-invalid' : ''} ${isFieldValid('email') ? 'glass-input-valid' : ''}`}
                  value={email}
                  placeholder="Generated from student ID"
                  readOnly
                />
              </div>
              {(emailError || isFieldInvalid('email')) && (
                <span className="glass-inline-error">{emailError || validationErrors.email}</span>
              )}
            </div>

            <div className="glass-field">
              <label htmlFor="password" className={`glass-label login-label ${isFieldInvalid('password') ? 'glass-label-error' : ''}`}>
                Password
              </label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`glass-input glass-input-password login-input ${isFieldInvalid('password') ? 'glass-input-invalid' : ''} ${isFieldValid('password') ? 'glass-input-valid' : ''}`}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => markTouched('password')}
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="glass-password-toggle login-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {(passwordError || isFieldInvalid('password')) && (
                <span className="glass-inline-error">{passwordError || validationErrors.password}</span>
              )}
            </div>

            <div className="glass-field">
              <label
                htmlFor="confirmPassword"
                className={`glass-label login-label ${isFieldInvalid('confirmPassword') ? 'glass-label-error' : ''}`}
              >
                Confirm password
              </label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <CheckCircle2 size={18} />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className={`glass-input glass-input-password login-input ${isFieldInvalid('confirmPassword') ? 'glass-input-invalid' : ''} ${isFieldValid('confirmPassword') ? 'glass-input-valid' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => markTouched('confirmPassword')}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="glass-password-toggle login-password-toggle"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {isFieldInvalid('confirmPassword') && <span className="glass-field-feedback">{validationErrors.confirmPassword}</span>}
            </div>

            <div className="register-field-full">
              {verificationRequested && (
                <div className="glass-field" style={{ marginBottom: '14px' }}>
                  <label htmlFor="verificationCode" className="glass-label login-label">
                    Email verification code
                  </label>
                  <div className="glass-input-wrap">
                    <span className="glass-input-icon login-input-icon" aria-hidden="true">
                      <Mail size={18} />
                    </span>
                    <input
                      id="verificationCode"
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      className="glass-input login-input"
                      placeholder="Enter 6-digit code"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setError('');
                      setSuccessMessage('');
                      try {
                        setLoading(true);
                        await sendSignupVerificationCode({
                          itNumber: studentId,
                          fullName: name,
                          email,
                          password,
                          phone,
                        });
                        setSuccessMessage('New verification code sent.');
                      } catch (resendError) {
                        setError(resendError.message || 'Failed to resend code.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="mt-2 text-sm font-semibold text-blue-800 hover:text-blue-900"
                  >
                    Resend code
                  </button>
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary register-submit">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {verificationRequested ? 'Verifying code...' : 'Sending code...'}
                  </>
                ) : (
                  <>
                    {verificationRequested ? 'Verify & Create Account' : 'Send Verification Code'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="glass-footer-text login-footer-text">
            Already have an account? <Link to="/login" className="glass-teal-link">Sign in</Link>
          </p>

          <p className="glass-legal-text login-legal-text">
            By creating an account, you agree to the Smart Campus terms of use and privacy policy.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RegistrationPage;
