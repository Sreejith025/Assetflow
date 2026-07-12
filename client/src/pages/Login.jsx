import React from 'react';
import { SignIn } from '@clerk/clerk-react';

const Login = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[110px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[25rem] h-[25rem] bg-violet-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2.5s' }}></div>

      {/* Main Glass Panel wrapping Clerk SignIn */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/35 mb-4 animate-float">
            <span className="text-white font-extrabold text-2xl">A</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">AssetFlow</span>
          </h2>
          <p className="text-xs text-slate-400 mt-2">Sign in using Clerk to access the asset console</p>
        </div>

        <SignIn 
          forceRedirectUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#8b5cf6',
              colorBackground: '#ffffff',
              colorText: '#0f172a',
              colorTextSecondary: '#475569',
              colorInputBackground: '#f8fafc',
              colorInputText: '#0f172a',
              colorBorder: '#e2e8f0'
            },
            elements: {
              card: 'bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 max-w-sm',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              footer: 'bg-transparent text-xs text-slate-500',
              socialButtonsBlockButton: 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100',
              formButtonPrimary: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold py-2.5 shadow-md shadow-violet-950/10 cursor-pointer text-white'
            }
          }}
        />

        {/* Developer configuration details */}
        <div className="mt-8 text-center max-w-xs">
          <p className="text-[9px] text-slate-650 leading-normal">
            💡 **Tip**: Syncing links Clerk to MongoDB automatically on login. If logging in with the email <span className="text-violet-400 font-semibold font-mono">admin@assetflow.com</span>, you will receive the **Admin** role. Other signups default to **Employee**.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
