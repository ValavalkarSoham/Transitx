import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bus,
  KeyRound,
  Mail,
  AlertCircle,
  ArrowRight,
  Radio,
  Zap,
  Shield,
  QrCode,
  Activity,
  CheckCircle,
} from 'lucide-react';

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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#09090b] text-zinc-100 font-sans relative overflow-hidden">
      
      {/* Background Yellow Glow Ambiance */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-yellow-400/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Cyber Telemetry Showcase */}
        <div className="lg:col-span-6 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-[11px] font-mono font-bold text-yellow-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            CONNECTED TO PU GOA TRANSIT NODE
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Smart Mobility for <br />
            <span className="text-yellow-400 neon-text-yellow">Students & Fleet Crews</span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md">
            Sign in to access your role-specific dashboard. Track all 20 Goa lines in real-time, configure proximity geofence radars, manage trip tickets, and verify fleet telemetry.
          </p>

          {/* Interactive Feature Highlights */}
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-[#121214] rounded-xl border border-zinc-800 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-yellow-400/10 text-yellow-400 flex items-center justify-center shrink-0 border border-yellow-400/30">
                <Radio className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Sub-Second Satellite Telemetry</span>
                <span className="text-[10px] text-zinc-400 block">Live WebSocket coordinates streamed from vehicle hardware</span>
              </div>
            </div>

            <div className="p-3 bg-[#121214] rounded-xl border border-zinc-800 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-yellow-400/10 text-yellow-400 flex items-center justify-center shrink-0 border border-yellow-400/30">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Proximity Geofence Chimes</span>
                <span className="text-[10px] text-zinc-400 block">500m & 1km audio/vibration triggers when your bus approaches</span>
              </div>
            </div>

            <div className="p-3 bg-[#121214] rounded-xl border border-zinc-800 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-yellow-400/10 text-yellow-400 flex items-center justify-center shrink-0 border border-yellow-400/30">
                <QrCode className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Holographic Digital QR Passes</span>
                <span className="text-[10px] text-zinc-400 block">Instant paperless verification with downloadable tax invoices</span>
              </div>
            </div>
          </div>

          {/* Live Node Status Snippet */}
          <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500 pt-2">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Activity className="h-3.5 w-3.5 text-yellow-400" />
              Latency: 14ms
            </span>
            <span>•</span>
            <span className="text-zinc-400">20 Lines Mapped</span>
            <span>•</span>
            <span className="text-zinc-400">Betul HQ Hub</span>
          </div>
        </div>

        {/* Right Column: Portal Login Card */}
        <div className="lg:col-span-6">
          <div className="bg-[#121214] py-8 px-6 sm:px-10 rounded-2xl shadow-2xl border border-zinc-800 hover:border-yellow-400/40 transition-all text-left relative">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                    <Bus className="h-4 w-4 text-yellow-400" />
                  </div>
                  Portal Login
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">Enter your verified credentials to enter TransitX</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-mono text-[9px] font-bold">
                SECURE SSL
              </span>
            </div>

            {authError && (
              <div className="mb-5 bg-red-950/40 border border-red-900/60 text-red-300 px-4 py-3 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
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
                    placeholder="student@transitx.com"
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.35)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
              <span className="text-zinc-400">New to TransitX?</span>
              <Link to="/signup" className="font-bold text-yellow-400 hover:text-yellow-300 transition-colors">
                Create new account &rarr;
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
