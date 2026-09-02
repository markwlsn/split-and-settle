import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Receipt, Sparkles, ArrowRight, ShieldCheck, Zap, Layers, Loader2 } from 'lucide-react';

export default function AuthView() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Name is required');
        }
        await register(email, password, name.trim());
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
    if (!isLogin) setName(testName);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Headline */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/20 mb-4">
            <Receipt className="h-7 w-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 sm:text-3xl">
            Split & Settle
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Intelligent receipt OCR splitting with Google Gemini Vision
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/60">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                isLogin
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                !isLogin
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-medium text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alice Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="alice@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 transition active:scale-95"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Quick Demo Fill
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('alice@test.com', 'Alice')}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400 transition"
              >
                Alice (alice@test.com)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('bob@test.com', 'Bob')}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400 transition"
              >
                Bob (bob@test.com)
              </button>
            </div>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col items-center rounded-2xl border border-slate-800/60 bg-slate-900/30 p-3">
            <Sparkles className="h-4 w-4 text-emerald-400 mb-1" />
            <span className="text-[11px] font-semibold text-slate-300">Gemini Vision</span>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-slate-800/60 bg-slate-900/30 p-3">
            <ShieldCheck className="h-4 w-4 text-teal-400 mb-1" />
            <span className="text-[11px] font-semibold text-slate-300">PII Privacy</span>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-slate-800/60 bg-slate-900/30 p-3">
            <Zap className="h-4 w-4 text-amber-400 mb-1" />
            <span className="text-[11px] font-semibold text-slate-300">Auto Settle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
