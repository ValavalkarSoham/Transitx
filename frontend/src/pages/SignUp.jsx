import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { UserPlus, Mail, KeyRound, User as UserIcon, BookOpen, Briefcase, AlertCircle } from 'lucide-react';

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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-950 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
          Create Your Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-sky-400 hover:text-sky-300">
            Log in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-slate-800/80">
          {error && (
            <div className="mb-4 bg-red-955 bg-red-955/35 bg-red-950/30 border border-red-900/50 text-red-400 px-4 py-3 rounded-md text-sm flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase">Full Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-sm text-white placeholder-slate-650"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-sm text-white placeholder-slate-650"
                  placeholder="john@school.edu"
                />
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase">Select Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full py-2 px-3 border border-slate-800 bg-slate-950 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm font-semibold text-white"
              >
                <option value="student">Student</option>
                <option value="employee">Employee (Driver / Conductor)</option>
              </select>
            </div>

            {/* Student specific fields */}
            {formData.role === 'student' && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-sky-955 bg-sky-950/20 rounded-lg border border-sky-900/30">
                <div>
                  <label className="block text-[10px] font-bold text-sky-400 uppercase">Roll Number</label>
                  <input
                    type="text"
                    name="rollNumber"
                    required
                    value={formData.rollNumber}
                    onChange={handleChange}
                    placeholder="CS-101"
                    className="mt-1 block w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-sky-400 uppercase">Department</label>
                  <input
                    type="text"
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="CSE"
                    className="mt-1 block w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Employee specific fields */}
            {formData.role === 'employee' && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-amber-950/20 rounded-lg border border-amber-900/30">
                <div>
                  <label className="block text-[10px] font-bold text-amber-400 uppercase">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    required
                    value={formData.employeeId}
                    onChange={handleChange}
                    placeholder="EMP-44"
                    className="mt-1 block w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-400 uppercase">Designation</label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="mt-1 block w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:ring-amber-500 focus:border-amber-500 font-semibold"
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
              <label className="block text-xs font-bold text-slate-400 uppercase">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-sm text-white placeholder-slate-650"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase">Confirm Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-sm text-white placeholder-slate-650"
                  placeholder="Repeat password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
