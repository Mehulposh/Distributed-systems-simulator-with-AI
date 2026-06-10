import  { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../api/apiService.js';
import { useAppStore } from '../zustand/UseAppstore.js';

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { setUser, setToken } = useAppStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = mode === 'login'
        ? await authAPI.login({ email: form.email, password: form.password })
        : await authAPI.register(form);
      setToken(res.token);
      setUser(res.user);
      onClose();
    } catch (err) {
      setError(err.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: '#12151d', border: '1px solid #2e3650', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e2335' }}>
          <div>
            <div className="font-semibold text-white">{mode === 'login' ? 'Welcome back' : 'Create account'}</div>
            <div className="text-xs text-slate-500 mt-0.5">DistSim — Distributed Systems Simulator</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                required
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                style={{ background: '#1e2335', border: '1px solid #2e3650', color: '#e2e8f0' }}
                onFocus={(e) => (e.target.style.borderColor = '#4c6ef5')}
                onBlur={(e) => (e.target.style.borderColor = '#2e3650')}
              />
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{ background: '#1e2335', border: '1px solid #2e3650', color: '#e2e8f0' }}
              onFocus={(e) => (e.target.style.borderColor = '#4c6ef5')}
              onBlur={(e) => (e.target.style.borderColor = '#2e3650')}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 pr-10 rounded-lg text-sm outline-none transition-all"
                style={{ background: '#1e2335', border: '1px solid #2e3650', color: '#e2e8f0' }}
                onFocus={(e) => (e.target.style.borderColor = '#4c6ef5')}
                onBlur={(e) => (e.target.style.borderColor = '#2e3650')}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-400 px-3 py-2 rounded-lg" style={{ background: '#ef444420', border: '1px solid #ef444440' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: '#4c6ef5', color: 'white' }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="text-center text-xs text-slate-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}