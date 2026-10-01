import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, KeyRound, Mail, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect based on role
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'employee') {
        navigate('/employee');
      } else if (user.role === 'student') {
        navigate('/student');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.role === 'admin') {
        navigate('/admin');
      } else if (data.role === 'employee') {
        navigate('/employee');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setAuthError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#09090b] text-zinc-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-yellow-400/10 border border-yellow-400/30 p-3.5 rounded-2xl shadow-[0_0_20px_rgba(250,204,21,0.2)]">
            <Bus className="h-10 w-10 text-yellow-400" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-white tracking-tight">
          Transit<span className="text-yellow-400 neon-text-yellow">X</span> Portal Login
        </h2>
        <p className="mt-2 text-center text-xs text-zinc-400">
          Sign in to access Student Space, Driver Panel, or Admin console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#121214] py-8 px-5 shadow-2xl sm:rounded-2xl sm:px-10 border border-zinc-800 hover:border-yellow-400/40 transition-all">
          {authError && (
            <div className="mb-5 bg-red-950/40 border border-red-900/60 text-red-300 px-4 py-3 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#09090b] border border-zinc-700 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                  placeholder="alex@transitx.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-[#09090b] border border-zinc-700 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-xs text-white placeholder-zinc-600 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.35)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
            <span className="text-xs text-zinc-400">Don't have an account? </span>
            <Link to="/signup" className="text-xs font-bold text-yellow-400 hover:text-yellow-300 transition-colors">
              Create one here &rarr;
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
