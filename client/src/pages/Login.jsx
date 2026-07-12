import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Employee');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password || (isRegister && !fullName)) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await register(fullName, email, password, role);
        toast.success(`Account created successfully as ${role}!`);
      } else {
        await login(email, password);
        toast.success('Logged in successfully!');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background HSL Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[110px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[25rem] h-[25rem] bg-violet-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2.5s' }}></div>

      {/* Main Glass Box */}
      <div className="w-full max-w-lg glass-card rounded-2xl border border-slate-800/80 p-8 sm:p-10 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/35 mb-4 animate-float">
            <span className="text-white font-extrabold text-2xl">A</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">AssetFlow</span>
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            {isRegister 
              ? 'Register an enterprise account to assign and request company assets' 
              : 'Sign in to access your asset management portal'
            }
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <FiUser size={15} />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-900/60 border border-slate-850 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/80 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 transition-all"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <FiMail size={15} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. employee@assetflow.com"
                className="w-full bg-slate-900/60 border border-slate-850 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/80 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Password</label>
              {!isRegister && (
                <a href="#" className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold transition-colors">Forgot Password?</a>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <FiLock size={15} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-900/60 border border-slate-850 focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/80 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 transition-all"
                required
              />
            </div>
          </div>

          {/* Registration Role Cards */}
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">System Role</label>
              <div className="grid grid-cols-2 gap-2">
                {['Employee', 'Department Head', 'Asset Manager', 'Admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`
                      px-3 py-2 text-[10px] font-semibold border rounded-lg text-center transition-all duration-200 cursor-pointer
                      ${role === r 
                        ? 'bg-violet-600/10 border-violet-500/40 text-violet-300' 
                        : 'bg-slate-900/20 border-slate-800 text-slate-500 hover:text-slate-350 hover:border-slate-700'
                      }
                    `}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:from-violet-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-md shadow-violet-950/20 flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {submitting ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
            ) : (
              <span>{isRegister ? 'Create System Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-500">
            {isRegister ? 'Already have an account?' : 'Need to test with another role?'}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-violet-400 hover:text-violet-300 font-bold ml-1.5 focus:outline-none transition-colors cursor-pointer"
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>

        {/* Dev note */}
        <div className="mt-8 border-t border-slate-800/50 pt-4 text-center">
          <p className="text-[9px] text-slate-500 leading-normal">
            💡 **Local Sandbox Mode**: If backend server is offline, emails starting with <span className="text-violet-400 font-semibold font-mono">admin...</span>, <span className="text-violet-400 font-semibold font-mono">manager...</span>, or <span className="text-violet-400 font-semibold font-mono">head...</span> automatically bypass networking to simulate respective roles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
