import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import {
  UserPlus,
  Mail,
  KeyRound,
  User as UserIcon,
  BookOpen,
  Briefcase,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Bus,
  CheckCircle,
  Shield,
  Zap,
} from 'lucide-react';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    rollNumber: '',
    department: '',
    employeeId: '',
    designation: 'Driver',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);

    try {
      const extraFields = {};
      if (formData.role === 'student') {
        extraFields.rollNumber = formData.rollNumber;
        extraFields.department = formData.department;
      } else if (formData.role === 'employee') {
        extraFields.employeeId = formData.employeeId;
        extraFields.designation = formData.designation;
      }

      const res = await authService.register(
        formData.name,
        formData.email,
        formData.password,
        formData.role,
        extraFields
      );

      if (res.success) {
        localStorage.setItem('token', res.data.token);
        setUser({
          _id: res.data._id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
        });

        // Redirect based on role
        if (res.data.role === 'admin') {
          navigate('/admin');
        } else if (res.data.role === 'employee') {
          navigate('/employee');
        } else {
          navigate('/student');
        }
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#09090b] text-zinc-100 font-sans relative overflow-hidden">
      
      {/* Background Yellow Glow Ambiance */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-5 left-10 w-80 h-80 bg-yellow-400/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Account Benefits & Role Architecture */}
        <div className="lg:col-span-5 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-[11px] font-mono font-bold text-yellow-400">
            <span className="h-2 w-2 rounded-full bg-yellow-400 animate-ping"></span>
            TRANSITX PORTAL ONBOARDING
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Join the Smart <br />
            <span className="text-yellow-400 neon-text-yellow">Campus Transit Grid</span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Create your account to unlock interactive telemetry maps, proximity geofence chimes, digital passes, or driver GPS dispatch.
          </p>

          {/* Role Privileges Cards */}
          <div className="space-y-3 pt-2">
            <div className="p-3.5 bg-[#121214] rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2.5 mb-1">
                <GraduationCap className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-black text-white">Student Space Privileges</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Live Goa map tracking, 500m geofence alerts, digital passes with QR codes, and 24/7 AI TransitBot assistance.
              </p>
            </div>

            <div className="p-3.5 bg-[#121214] rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2.5 mb-1">
                <Briefcase className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-black text-white">Staff / Driver Privileges</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                GPS telemetry broadcaster, live passenger occupancy meter, and real-time student delay notifications.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs text-zinc-400">
            <Shield className="h-4 w-4 text-yellow-400 shrink-0" />
            <span>Campus Verified Encryption • Instant Access</span>
          </div>
        </div>

        {/* Right Column: Registration Card */}
        <div className="lg:col-span-7">
          <div className="bg-[#121214] py-8 px-6 sm:px-10 rounded-2xl shadow-2xl border border-zinc-800 hover:border-yellow-400/40 transition-all text-left relative">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-yellow-400" />
                  </div>
                  Create Account
                </h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">Select your role and enter your profile information</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-mono text-[9px] font-bold">
                INSTANT PASS
              </span>
            </div>

            {error && (
              <div className="mb-5 bg-red-950/40 border border-red-900/60 text-red-300 px-4 py-3 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              
              {/* Full Name & Email in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">Full Name</label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3.5 py-2 bg-[#09090b] border border-zinc-700 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-xs text-white placeholder-zinc-600 outline-none"
                      placeholder="Alex Fernandes"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">Email Address</label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3.5 py-2 bg-[#09090b] border border-zinc-700 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-xs text-white placeholder-zinc-600 outline-none"
                      placeholder="alex@transitx.com"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">Select Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 block w-full py-2 px-3 border border-zinc-700 bg-[#09090b] rounded-xl text-xs font-bold text-white focus:border-yellow-400 outline-none"
                >
                  <option value="student">Student (Campus Commuter)</option>
                  <option value="employee">Employee (Driver / Conductor)</option>
                </select>
              </div>

              {/* Student specific fields */}
              {formData.role === 'student' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-yellow-400/5 rounded-xl border border-yellow-400/20">
                  <div>
                    <label className="block text-[10px] font-bold text-yellow-400 uppercase">Roll Number</label>
                    <input
                      type="text"
                      name="rollNumber"
                      required
                      value={formData.rollNumber}
                      onChange={handleChange}
                      placeholder="CS-101"
                      className="mt-1 block w-full px-2.5 py-1.5 bg-[#09090b] border border-zinc-700 rounded-lg text-xs text-white focus:border-yellow-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-yellow-400 uppercase">Department</label>
                    <input
                      type="text"
                      name="department"
                      required
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="CSE / IT"
                      className="mt-1 block w-full px-2.5 py-1.5 bg-[#09090b] border border-zinc-700 rounded-lg text-xs text-white focus:border-yellow-400 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Employee specific fields */}
              {formData.role === 'employee' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-yellow-400/5 rounded-xl border border-yellow-400/20">
                  <div>
                    <label className="block text-[10px] font-bold text-yellow-400 uppercase">Employee ID</label>
                    <input
                      type="text"
                      name="employeeId"
                      required
                      value={formData.employeeId}
                      onChange={handleChange}
                      placeholder="EMP-44"
                      className="mt-1 block w-full px-2.5 py-1.5 bg-[#09090b] border border-zinc-700 rounded-lg text-xs text-white focus:border-yellow-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-yellow-400 uppercase">Designation</label>
                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="mt-1 block w-full px-2.5 py-1.5 bg-[#09090b] border border-zinc-700 rounded-lg text-xs text-white font-bold focus:border-yellow-400 outline-none"
                    >
                      <option value="Driver">Driver</option>
                      <option value="Conductor">Conductor</option>
                      <option value="Inspector">Inspector</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">Password</label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3.5 py-2 bg-[#09090b] border border-zinc-700 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-xs text-white placeholder-zinc-600 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">Confirm Password</label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <KeyRound className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3.5 py-2 bg-[#09090b] border border-zinc-700 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 text-xs text-white placeholder-zinc-600 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.35)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <span>{loading ? 'Creating Account...' : 'Register Workspace Account'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
              <span className="text-zinc-400">Already have an account?</span>
              <Link to="/login" className="font-bold text-yellow-400 hover:text-yellow-300 transition-colors">
                Sign in here &rarr;
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SignUp;
