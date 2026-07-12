import React, { useContext, useEffect } from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[110px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[25rem] h-[25rem] bg-violet-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2.5s' }} />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <SignIn 
          signUpUrl={null}
          appearance={{
            elements: {
              card: 'bg-white shadow-2xl border border-slate-200 rounded-2xl p-6',
              headerTitle: 'text-slate-900 font-extrabold text-xl',
              headerSubtitle: 'text-slate-500 text-xs',
              socialButtonsBlockButton: 'border border-slate-200 hover:bg-slate-50 text-slate-700',
              formFieldLabel: 'text-slate-700 font-bold text-[11px] uppercase tracking-widest',
              formFieldInput: 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 rounded-lg text-sm',
              formButtonPrimary: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-lg text-sm shadow-md',
              footerActionText: 'text-slate-500 text-xs',
              footerActionLink: 'text-violet-600 hover:text-violet-500 font-bold text-xs',
              dividerLine: 'bg-slate-200',
              dividerText: 'text-slate-400 text-xs'
            }
          }}
          forceRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
};

export default Login;
