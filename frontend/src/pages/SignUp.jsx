import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { UserPlus, Mail, KeyRound, User as UserIcon, BookOpen, Briefcase, AlertCircle, ArrowRight } from 'lucide-react';

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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#09090b] text-zinc-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-yellow-400/10 border border-yellow-400/30 p-3.5 rounded-2xl shadow-[0_0_20px_rgba(250,204,21,0.2)]">
            <UserPlus className="h-9 w-9 text-yellow-400" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-white tracking-tight">
          Create Transit<span className="text-yellow-400 neon-text-yellow">X</span> Account
        </h2>
        <p className="mt-2 text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-yellow-400 hover:text-yellow-300">
            Log in here &rarr;
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#121214] py-8 px-5 shadow-2xl sm:rounded-2xl sm:px-10 border border-zinc-800 hover:border-yellow-400/40 transition-all">
          {error && (
            <div className="mb-5 bg-red-950/40 border border-red-900/60 text-red-300 px-4 py-3 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name */}
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
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
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
                  placeholder="john@school.edu"
                />
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
                <option value="student">Student</option>
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
                    placeholder="CSE"
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

            {/* Password */}
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
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            {/* Confirm Password */}
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
                  placeholder="Repeat password"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.35)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
