import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  User,
  Mail,
  Lock,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ThreadPilotLogo } from '../components/brand/ThreadPilotLogo';
import { AuthHeroIllustration } from '../components/brand/AuthHeroIllustration';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationCode: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Real-time password requirement analysis
  const passwordCriteria = {
    length: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasNumberOrSymbol: /[0-9!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  };

  const getPasswordStrength = () => {
    if (!formData.password) return { score: 0, label: '', color: 'bg-secondary-200' };
    const passedCount = Object.values(passwordCriteria).filter(Boolean).length;
    if (passedCount === 1) return { score: 33, label: 'Weak', color: 'bg-amber-500' };
    if (passedCount === 2) return { score: 66, label: 'Good', color: 'bg-blue-500' };
    if (passedCount === 3) return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
    return { score: 15, label: 'Weak', color: 'bg-amber-500' };
  };

  const strength = getPasswordStrength();

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
        return !value.trim() ? 'First name is required' : '';
      case 'lastName':
        return !value.trim() ? 'Last name is required' : '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid work email format';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      case 'organizationName':
        return !value.trim() ? 'Organization name is required' : '';
      case 'organizationCode':
        if (!value.trim()) return 'Organization code is required';
        if (value.length < 2) return 'Code must be at least 2 characters';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([field, val]) => {
      const err = validateField(field, val);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    // Mark all touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((k) => {
      allTouched[k] = true;
    });
    setTouched(allTouched);

    if (!validateAll()) return;

    setLoading(true);
    try {
      await register(formData);
      toast.success('Organization account created successfully!');
      navigate('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine if an error should visually render
  const getVisibleError = (fieldName: string) => {
    return (touched[fieldName] || hasSubmitted) ? errors[fieldName] : undefined;
  };

  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-12 bg-secondary-50 selection:bg-blue-100 selection:text-navy-900">
      {/* Left Column: Premium Architectural Brand Hero */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-6 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-white relative overflow-hidden flex-col justify-between p-10 xl:p-14 border-r border-navy-800">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-brass-500/15 blur-3xl pointer-events-none" />

        {/* Ambient Grid Weave */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="tp-hero-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tp-hero-grid-pattern)" />
        </svg>

        {/* Brand Lockup */}
        <div className="relative z-10">
          <ThreadPilotLogo variant="full" theme="dark" size="lg" />
        </div>

        {/* Hero Narrative + 3D Dimensional Illustration */}
        <div className="relative z-10 my-auto py-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800/80 border border-navy-700/80 text-brass-300 text-xs font-semibold uppercase tracking-wider mb-5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-brass-400" />
            <span>Enterprise Workspace Setup</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
            Unified intelligence for hosiery & wholesale manufacturing.
          </h2>
          <p className="text-sm xl:text-base text-slate-300 font-normal leading-relaxed mb-6">
            Establish a strictly isolated tenant partition with continuous inventory tracking, OCR invoice reconciliation, and automated stockout alerts.
          </p>

          {/* 3D Dimensional Illustration */}
          <div className="mb-6">
            <AuthHeroIllustration />
          </div>

          {/* Trust Value Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Dedicated tenant database isolation</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brass-400 flex-shrink-0" />
              <span>Unlimited team seats & audit logs</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Real-time inventory valuation</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brass-400 flex-shrink-0" />
              <span>Automated supplier OCR matching</span>
            </div>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Multi-Tenant Architecture</span>
          </div>
          <span className="font-mono text-slate-400">SOC2 Certified • 2026</span>
        </div>
      </div>

      {/* Right Column: Clean, High-Contrast Registration Card */}
      <div className="flex-1 lg:col-span-7 xl:col-span-6 flex flex-col justify-center px-4 sm:px-8 md:px-12 py-10 lg:py-14 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto">
          {/* Mobile Brand Header */}
          <div className="lg:hidden mb-6 text-center">
            <ThreadPilotLogo variant="full" theme="light" size="lg" className="justify-center" />
          </div>

          <div className="bg-white rounded-2xl border border-secondary-200/90 shadow-xl p-7 sm:p-10">
            {/* Form Title & Subtitle */}
            <div className="mb-6 pb-4 border-b border-secondary-100">
              <h1 className="text-2xl font-bold text-navy-900 tracking-tight">
                Create your organization account
              </h1>
              <p className="text-sm text-secondary-600 mt-1">
                Deploy your dedicated workspace for wholesale inventory and finance workflows
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Section 1: Administrator Profile */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-navy-900" />
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary-700">
                    Administrator Profile
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={getVisibleError('firstName')}
                    placeholder="Jane"
                    autoComplete="given-name"
                    autoFocus
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={getVisibleError('lastName')}
                    placeholder="Doe"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              {/* Section 2: Contact Details */}
              <div>
                <Input
                  label="Work Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={getVisibleError('email')}
                  placeholder="jane@company.com"
                  autoComplete="email"
                  leftIcon={<Mail className="w-4 h-4 text-secondary-400" />}
                  helperText="You will use this email address as your workspace administrator login"
                />
              </div>

              {/* Section 3: Organization Parameters */}
              <div className="pt-2 border-t border-secondary-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-navy-900" />
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary-700">
                      Organization Parameters
                    </span>
                  </div>
                  {formData.organizationCode && (
                    <span className="text-[11px] font-mono text-navy-700 bg-secondary-100 px-2 py-0.5 rounded border border-secondary-200">
                      {formData.organizationCode.toLowerCase()}.threadpilot.ai
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={getVisibleError('organizationName')}
                    placeholder="Apex Hosiery Mills"
                  />
                  <Input
                    label="Organization Code"
                    name="organizationCode"
                    value={formData.organizationCode}
                    onChange={(e) => {
                      const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                      setFormData((prev) => ({ ...prev, organizationCode: upper }));
                      if (errors.organizationCode) setErrors((prev) => ({ ...prev, organizationCode: '' }));
                    }}
                    onBlur={handleBlur}
                    error={getVisibleError('organizationCode')}
                    placeholder="APEX"
                    maxLength={10}
                    helperText="2-8 letters/digits (used for team member sign-in)"
                  />
                </div>
              </div>

              {/* Section 4: Security Credentials */}
              <div className="pt-2 border-t border-secondary-100">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-navy-900" />
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary-700">
                    Security Credentials
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={getVisibleError('password')}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-secondary-400 hover:text-navy-900 transition-colors p-1"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={getVisibleError('confirmPassword')}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-secondary-400 hover:text-navy-900 transition-colors p-1"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                </div>

                {/* Password Strength Meter & Interactive Requirements */}
                {formData.password && (
                  <div className="mt-3 p-3 bg-secondary-50 rounded-xl border border-secondary-200/80 animate-fade-in">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="text-secondary-600 font-medium">Password Strength:</span>
                      <span className="font-semibold text-secondary-800">{strength.label}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-secondary-200 rounded-full overflow-hidden mb-2.5">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>

                    {/* Interactive Requirement Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordCriteria.length ? 'text-emerald-700 font-semibold' : 'text-secondary-500'
                        }`}
                      >
                        {passwordCriteria.length ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-secondary-400 flex-shrink-0" />
                        )}
                        <span>8+ Characters</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordCriteria.hasUpper ? 'text-emerald-700 font-semibold' : 'text-secondary-500'
                        }`}
                      >
                        {passwordCriteria.hasUpper ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-secondary-400 flex-shrink-0" />
                        )}
                        <span>Uppercase letter</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordCriteria.hasNumberOrSymbol
                            ? 'text-emerald-700 font-semibold'
                            : 'text-secondary-500'
                        }`}
                      >
                        {passwordCriteria.hasNumberOrSymbol ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-secondary-400 flex-shrink-0" />
                        )}
                        <span>Number or symbol</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-md hover:shadow-lg text-sm py-3 font-semibold bg-navy-900 hover:bg-navy-800 text-white transition-all rounded-xl group"
                  loading={loading}
                  rightIcon={<ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />}
                >
                  {loading ? 'Creating organization account...' : 'Create Organization Account'}
                </Button>
              </div>
            </form>

            {/* Switch to Login Link */}
            <div className="mt-6 pt-5 border-t border-secondary-100 text-center">
              <p className="text-xs text-secondary-600">
                Already have an organization workspace?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-navy-900 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                >
                  <span>Sign in</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </div>
          </div>

          {/* Trust and Compliance Assurance Footnote */}
          <div className="mt-6 text-center text-xs text-secondary-500">
            Enterprise Security • 256-Bit Tenant Encryption • Continuous Data Backups
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
