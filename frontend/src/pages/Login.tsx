import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Building2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ThreadPilotLogo } from '../components/brand/ThreadPilotLogo';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    if (!organizationCode) newErrors.organizationCode = 'Organization code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password, organizationCode, rememberMe);
      toast.success('Welcome back to ThreadPilot AI!');
      navigate('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-12 bg-secondary-50 selection:bg-blue-100 selection:text-navy-900">
      {/* Left Column: Premium Enterprise Hero Panel */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-850 text-white relative overflow-hidden flex-col justify-between p-12 xl:p-16 border-r border-navy-800">
        {/* Layered background radial glows & architectural thread weave geometry */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-brass-500/10 blur-3xl pointer-events-none" />

        {/* Ambient SVG Grid & Thread Monogram Art */}
        <svg
          className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="tp-hero-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tp-hero-grid)" />
        </svg>

        {/* Top Brand Indicator */}
        <div className="relative z-10">
          <ThreadPilotLogo variant="full" theme="dark" size="lg" />
        </div>

        {/* Hero Narrative Content */}
        <div className="relative z-10 max-w-xl my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-brass-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-brass-400" />
            <span>Next-Generation Operations OS</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Unified intelligence for hosiery & wholesale enterprise operations.
          </h2>
          <p className="text-base text-slate-300 font-normal leading-relaxed mb-8">
            Manage inventory valuation, supplier OCR workflows, order fulfillment, and multi-tenant ledger accounts in one continuous, precision-crafted platform.
          </p>

          {/* Value Proposition Pills */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <div className="w-6 h-6 rounded-md bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Automated OCR ingestion for supplier invoices with multi-line matching</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <div className="w-6 h-6 rounded-md bg-brass-500/20 border border-brass-400/30 flex items-center justify-center text-brass-300 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Real-time inventory valuation with proactive stockout prevention</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <div className="w-6 h-6 rounded-md bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 flex-shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Strict organization-level multi-tenant isolation and audit logging</span>
            </div>
          </div>
        </div>

        {/* Footer Security Assurance */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SOC2 Type II & Multi-Tenant Isolated Infrastructure</span>
          </div>
          <span className="tabular-nums font-mono">v1.0.0-PROD</span>
        </div>
      </div>

      {/* Right Column: Clean, High-Contrast Sign-in Card */}
      <div className="flex-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-center px-4 sm:px-8 md:px-12 py-10 lg:py-16">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Brand Header */}
          <div className="lg:hidden mb-8 text-center">
            <ThreadPilotLogo variant="full" theme="light" size="lg" className="justify-center" />
          </div>

          <div className="bg-white rounded-2xl border border-secondary-200/90 shadow-xl p-8 sm:p-10">
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
                Sign in to your organization
              </h1>
              <p className="text-xs sm:text-sm text-secondary-500 mt-1">
                Enter your credentials to access your business console
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Work Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
              </div>

              <Input
                label="Organization Code"
                value={organizationCode}
                onChange={(e) => setOrganizationCode(e.target.value.toUpperCase())}
                error={errors.organizationCode}
                placeholder="ORG001"
                autoComplete="off"
                leftIcon={<Building2 className="w-4 h-4 text-secondary-400" />}
                helperText="Ask your workspace administrator for your 2 to 8 character code"
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-secondary-300 text-navy-900 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-secondary-600">Remember session</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-navy-900 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-md text-sm py-2.5 font-semibold"
                  loading={loading}
                >
                  Sign in to Console
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-secondary-100 text-center">
              <p className="text-xs text-secondary-500">
                Need to register a new company?{' '}
                <Link to="/register" className="font-semibold text-navy-900 hover:text-blue-600 transition-colors">
                  Create an organization
                </Link>
              </p>
            </div>
          </div>

          {/* Quick Support Footnote */}
          <div className="mt-6 text-center text-xs text-secondary-400">
            Protected by ThreadPilot Enterprise Security • Multi-Tenant Isolated
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
