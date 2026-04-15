
import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../services/firebase';
import { Lock, Mail, User as UserIcon, LogIn, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import Logo from './Logo';

interface AuthProps {
  onLogin: (user: any) => void;
  onBack?: () => void; // Added onBack prop
}

const Auth: React.FC<AuthProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userCredential;
      
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      onLogin(userCredential.user);

    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-pink-200/40 rounded-full blur-3xl"></div>
            <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-rose-200/40 rounded-full blur-3xl"></div>
        </div>

      <div className="bg-white p-8 rounded-2xl border border-pink-100 shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-300">
        
        {onBack && (
            <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
            </button>
        )}

        <div className="text-center mb-8 flex flex-col items-center">
          <Logo className="w-24 h-24 mb-4" orientation="vertical" />
        </div>

        <div className="flex bg-pink-50 p-1 rounded-lg mb-6">
            <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white text-pink-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Login
            </button>
            <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white text-pink-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Sign Up
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm text-slate-500 ml-1">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder:text-slate-400"
                        placeholder="citizen@urbanpulse.ai"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm text-slate-500 ml-1">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder:text-slate-400"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl transition-all transform active:scale-95 flex items-center justify-center mt-6 shadow-lg shadow-pink-200"
            >
                {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                    <>
                        {isLogin ? 'Sign In' : 'Create Account'}
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                )}
            </button>
        </form>
        
        <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
                Demo Mode Active: Login with any valid email.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
