import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, LogOut, Shield, User as UserIcon, GraduationCap, Briefcase } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      // Show if scrolling up, or if at the very top
      const isVisible = prevScrollPos > currentScrollPos || currentScrollPos < 10;
      
      setPrevScrollPos(currentScrollPos);
      setVisible(isVisible);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`bg-slate-950 border-b border-sky-500/30 shadow-[0_2px_15px_-3px_rgba(56,189,248,0.2)] sticky top-0 z-50 transition-transform duration-300 ${
      visible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Bus className="h-8 w-8 text-sky-400" />
              <span className="ml-2 text-xl font-bold text-white tracking-tight">
                Transit<span className="text-sky-400 neon-text-cyan">X</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-semibold transition-colors"
            >
              Home
            </Link>

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-semibold transition-colors"
                  >
                    <Shield className="h-4.5 w-4.5 mr-1 text-sky-400" />
                    Admin Panel
                  </Link>
                )}

                {user.role === 'employee' && (
                  <Link
                    to="/employee"
                    className="flex items-center text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-semibold transition-colors"
                  >
                    <Briefcase className="h-4.5 w-4.5 mr-1 text-sky-400" />
                    Employee Panel
                  </Link>
                )}

                {user.role === 'student' && (
                  <Link
                    to="/student"
                    className="flex items-center text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-semibold transition-colors"
                  >
                    <GraduationCap className="h-4.5 w-4.5 mr-1 text-sky-400" />
                    Student Space
                  </Link>
                )}

                <div className="h-4 w-px bg-slate-800" />
                <span className="text-xs text-slate-400 font-bold hidden sm:inline">
                  Hi, {user.name}
                </span>

                <button
                  onClick={handleLogout}
                  className="flex items-center text-red-400 hover:text-red-300 px-3 py-2 rounded-md text-xs font-bold border border-transparent hover:border-red-900/30 bg-red-955 bg-red-950/20 hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sky-400 hover:text-sky-300 px-3 py-2 rounded-md text-sm font-bold transition-colors"
                >
                  Portal Login
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded-md text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
