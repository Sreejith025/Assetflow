import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[110px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[25rem] h-[25rem] bg-violet-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2.5s' }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo + Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/35 mb-4">
            <span className="text-white font-extrabold text-2xl">A</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">AssetFlow</span>
          </h2>
          <p className="text-xs text-slate-400 mt-2">Sign in to access your asset console</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-2xl space-y-5"
        >
          {/* Email */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-2.5 text-[13px] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-900/70 border border-slate-700 rounded-lg px-4 py-2.5 text-[13px] text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[11px] font-semibold transition-colors"
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-[13px] font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-900/30 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Role hint */}
        <div className="mt-6 text-center">
          <p className="text-[9px] text-slate-600 leading-relaxed max-w-xs mx-auto">
            💡 Use <span className="text-violet-400 font-mono">admin@assetflow.com</span> for Admin access.
            Other emails default to the Employee role.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
