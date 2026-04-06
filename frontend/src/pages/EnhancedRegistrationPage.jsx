import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ChevronLeft, 
  GraduationCap, 
  CreditCard, 
  KeyRound,
  CheckCircle2,
  Sparkles,
  Phone
} from 'lucide-react';
import { register } from '../services/authService';
import AuthLayout from '../components/auth/AuthLayout';
import { cn } from '../lib/utils';

const FACULTIES = [
  { value: 'COMPUTING', label: 'Computing', prefix: 'IT' },
  { value: 'ENGINEERING', label: 'Engineering', prefix: 'EN' },
  { value: 'BUSINESS', label: 'SLIIT Business School', prefix: 'BM' },
  { value: 'HUMANITIES', label: 'Humanities & Sciences', prefix: 'HM' },
  { value: 'GRADUATE', label: 'Graduate Studies', prefix: 'GS' },
  { value: 'ARCHITECTURE', label: 'School of Architecture', prefix: 'AR' },
  { value: 'LAW', label: 'School of Law', prefix: 'LW' },
  { value: 'HOSPITALITY', label: 'School of Hospitality & Culinary', prefix: 'HS' },
  { value: 'FOUNDATION', label: 'Foundation Programme', prefix: 'FD' }
];

const EnhancedRegistrationPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    faculty: '',
    itNumber: '',
    campusEmail: '',
    mobileNumber: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  // Auto-suggest Student ID prefix based on faculty
  useEffect(() => {
    if (formData.faculty) {
      const selectedFaculty = FACULTIES.find(f => f.value === formData.faculty);
      if (selectedFaculty && (!formData.itNumber || formData.itNumber.length <= 2)) {
        setFormData(prev => ({ ...prev, itNumber: selectedFaculty.prefix }));
      }
    }
  }, [formData.faculty, formData.itNumber]);

  // Auto-generate campus email when Student ID looks complete
  useEffect(() => {
    if (formData.itNumber && formData.itNumber.length >= 7) {
      const email = `${formData.itNumber.toUpperCase()}@my.sliit.lk`;
      setFormData(prev => ({ ...prev, campusEmail: email }));
    }
  }, [formData.itNumber]);

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        if (!value) return 'Full name is required';
        return '';
      case 'faculty':
        if (!value) return 'Select a faculty';
        return '';
      case 'itNumber':
        if (!value) return 'Student ID required';
        return '';
      case 'mobileNumber':
        if (!value) return 'Mobile number required';
        if (!/^\d{10}$/.test(value)) return 'Enter valid 10 digits';
        return '';
      case 'password':
        if (value.length < 8) return 'Min 8 characters';
        return '';
      case 'confirmPassword':
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Final validation
    const errors = Object.keys(formData).map(key => validateField(key, formData[key])).filter(e => e);
    if (errors.length > 0) {
      setError('Please fix the errors in the form.');
      setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    setLoading(true);

    try {
      await register(formData.fullName, formData.campusEmail, formData.password, formData.mobileNumber);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-2xl space-y-8 animate-in mt-2 fade-in slide-in-from-bottom-6 duration-1000">
        <div>
          <Link 
            to="/login" 
            className="inline-flex items-center text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all mb-6 group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to login
          </Link>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Create Account</h2>
          <p className="text-slate-500 font-medium tracking-wide">Join the Smart Campus community</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50/50 backdrop-blur-sm border border-red-100/50 text-red-600 text-sm font-medium animate-in zoom-in-95 duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('fullName')}
                  className={cn(
                    "block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border rounded-2xl text-sm transition-all duration-300 outline-none",
                    touched.fullName && validateField('fullName', formData.fullName) 
                      ? "border-red-300 bg-red-50/20" 
                      : "border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                  )}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Faculty */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                Faculty
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <GraduationCap className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <select
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  onBlur={() => handleBlur('faculty')}
                  className={cn(
                    "block w-full pl-11 pr-10 py-3.5 bg-slate-50/50 border rounded-2xl text-sm transition-all duration-300 outline-none appearance-none cursor-pointer",
                    touched.faculty && validateField('faculty', formData.faculty) 
                      ? "border-red-300 bg-red-50/20" 
                      : "border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                  )}
                  required
                >
                  <option value="">Select Faculty</option>
                  {FACULTIES.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Student ID Number */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                Student ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CreditCard className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="itNumber"
                  value={formData.itNumber}
                  onChange={handleChange}
                  onBlur={() => handleBlur('itNumber')}
                  className={cn(
                    "block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border rounded-2xl text-sm transition-all duration-300 outline-none",
                    touched.itNumber && validateField('itNumber', formData.itNumber) 
                      ? "border-red-300 bg-red-50/20" 
                      : "border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                  )}
                  placeholder="IT23763180"
                  required
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                Mobile Number
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  onBlur={() => handleBlur('mobileNumber')}
                  className={cn(
                    "block w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border rounded-2xl text-sm transition-all duration-300 outline-none",
                    touched.mobileNumber && validateField('mobileNumber', formData.mobileNumber) 
                      ? "border-red-300 bg-red-50/20" 
                      : "border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                  )}
                  placeholder="0712345678"
                  required
                />
              </div>
            </div>

            {/* Hub Email (Auto) */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1 text-indigo-400/70">
                Official Campus Email (Generated)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-300" />
                </div>
                <input
                  type="email"
                  name="campusEmail"
                  value={formData.campusEmail}
                  readOnly
                  className="block w-full pl-12 pr-4 py-4 bg-slate-100/50 border border-slate-200/50 rounded-2xl text-base text-slate-400 outline-none cursor-not-allowed italic font-medium"
                  placeholder="ID@my.sliit.lk"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  className={cn(
                    "block w-full pl-11 pr-10 py-3.5 bg-slate-50/50 border rounded-2xl text-sm transition-all duration-300 outline-none",
                    touched.password && validateField('password', formData.password) 
                      ? "border-red-300 bg-red-50/20" 
                      : "border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                  )}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                Verify Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={cn(
                    "block w-full pl-11 pr-10 py-3.5 bg-slate-50/50 border rounded-2xl text-sm transition-all duration-300 outline-none",
                    touched.confirmPassword && formData.confirmPassword !== formData.password 
                      ? "border-red-300 bg-red-50/20" 
                      : (formData.confirmPassword && formData.confirmPassword === formData.password 
                        ? "border-green-400/50 focus:border-green-500" 
                        : "border-slate-200 focus:border-indigo-500")
                  )}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400"
                >
                  {formData.confirmPassword && formData.confirmPassword === formData.password ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 mt-4 group overflow-hidden relative"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-200 group-hover:animate-pulse" />
                Create Campus Account
              </span>
            )}
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-[shimmer_2s_infinite]" />
          </button>

          <div className="text-center pt-2">
            <p className="text-sm font-medium text-slate-500">
              Already a member?{' '}
              <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default EnhancedRegistrationPage;
