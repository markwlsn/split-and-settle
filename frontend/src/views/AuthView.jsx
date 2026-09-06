import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Receipt, Sparkles, ArrowRight, ShieldCheck, Zap, Loader2, Eye, EyeOff, Phone, Check } from 'lucide-react';

export default function AuthView() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin) {
      if (!name.trim()) {
        setError('Full Name is required');
        return;
      }
      if (!agreedToTerms) {
        setError('You must agree to the Terms of Service and Privacy Policy to create an account.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name.trim(), phone.trim() || undefined);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail, testName) => {
    setEmail(testEmail);
    setPassword('password123');
    if (!isLogin) {
      setName(testName);
      setPhone('+1 (555) 019-2834');
      setAgreedToTerms(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 selection:bg-white selection:text-black">
      <div className="w-full max-w-md">
        {/* Logo & Headline */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black shadow-2xl shadow-white/10 mb-4 transition-transform hover:scale-105">
            <Receipt className="h-7 w-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Split & Settle
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Intelligent receipt OCR splitting with Google Gemini Vision
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/80">
          {/* Segmented Control Tabs */}
          <div className="flex rounded-xl bg-black p-1 border border-neutral-800 mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                isLogin
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                !isLogin
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-medium text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Full Name (or First Name + Last Initial) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah M. or Alice Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/30 transition"
                  />
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Helps group members easily recognize who added a bill or owes money.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-black pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/30 transition"
                    />
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Used for contact syncing, SMS invites, and payment apps (Venmo, Zelle, PayPal).
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="alice@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/30 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-black pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 rounded-lg p-1 text-neutral-400 hover:text-white transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms & Privacy Agreement Checkbox */}
            {!isLogin && (
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <div className="relative flex items-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-4 w-4 rounded-md border border-neutral-700 bg-black peer-checked:bg-white peer-checked:border-white transition flex items-center justify-center">
                      {agreedToTerms && <Check className="h-3 w-3 text-black stroke-[3]" />}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400 leading-tight">
                    I agree to the <span className="text-white hover:underline cursor-pointer">Terms of Service</span> and <span className="text-white hover:underline cursor-pointer">Privacy Policy</span>.
                  </span>
                </label>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black shadow-lg shadow-white/10 hover:bg-neutral-200 disabled:opacity-50 transition active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-black" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.2]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-neutral-800 text-center">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
              Quick Demo Fill
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('alice@test.com', 'Alice Smith')}
                className="rounded-lg border border-neutral-800 bg-black px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-neutral-600 hover:text-white transition active:scale-95"
              >
                Alice (alice@test.com)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('bob@test.com', 'Bob Jones')}
                className="rounded-lg border border-neutral-800 bg-black px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-neutral-600 hover:text-white transition active:scale-95"
              >
                Bob (bob@test.com)
              </button>
            </div>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-neutral-900/40 p-3">
            <Sparkles className="h-4 w-4 text-white mb-1" />
            <span className="text-[11px] font-medium text-neutral-300">Gemini Vision</span>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-neutral-900/40 p-3">
            <ShieldCheck className="h-4 w-4 text-white mb-1" />
            <span className="text-[11px] font-medium text-neutral-300">PII Privacy</span>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-neutral-900/40 p-3">
            <Zap className="h-4 w-4 text-white mb-1" />
            <span className="text-[11px] font-medium text-neutral-300">Auto Settle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
