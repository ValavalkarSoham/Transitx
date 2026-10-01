import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, LogOut, Shield, User as UserIcon, GraduationCap, Briefcase, Bot } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
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
    <nav className={`bg-[#09090b] border-b border-yellow-500/25 shadow-[0_4px_25px_rgba(0,0,0,0.9)] sticky top-0 z-50 transition-transform duration-300 ${
      visible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="h-9 w-9 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center group-hover:border-yellow-400 transition-colors">
                <Bus className="h-5 w-5 text-yellow-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="ml-2.5 text-xl font-black text-white tracking-tight">
                Transit<span className="text-yellow-400 neon-text-yellow">X</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              to="/"
              className="text-zinc-300 hover:text-yellow-400 px-2.5 py-1.5 rounded-md text-sm font-bold transition-colors"
            >
              Home
            </Link>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('openTransitBot'))}
              className="flex items-center gap-1.5 px-3 py-1 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 rounded-md text-xs font-black tracking-wider transition-all shadow-[0_0_12px_rgba(250,204,21,0.25)] hover:shadow-[0_0_18px_rgba(250,204,21,0.45)]"
            >
              <Bot className="h-3.5 w-3.5 text-yellow-400 animate-pulse" />
              <span className="hidden sm:inline">AI TransitBot</span>
              <span className="sm:hidden">AI</span>
            </button>

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center text-zinc-300 hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-bold transition-colors"
                  >
                    <Shield className="h-4.5 w-4.5 mr-1 text-yellow-400" />
                    Admin Panel
                  </Link>
                )}

                {user.role === 'employee' && (
                  <Link
                    to="/employee"
                    className="flex items-center text-zinc-300 hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-bold transition-colors"
                  >
                    <Briefcase className="h-4.5 w-4.5 mr-1 text-yellow-400" />
                    Driver Panel
                  </Link>
                )}

                {user.role === 'student' && (
                  <Link
                    to="/student"
                    className="flex items-center text-zinc-300 hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-bold transition-colors"
                  >
                    <GraduationCap className="h-4.5 w-4.5 mr-1 text-yellow-400" />
                    Student Space
                  </Link>
                )}

                <div className="h-4 w-px bg-zinc-800" />
                <span className="text-xs text-zinc-400 font-bold hidden sm:inline">
                  Hi, <span className="text-yellow-400">{user.name}</span>
                </span>

                <button
                  onClick={handleLogout}
                  className="flex items-center text-red-400 hover:text-red-300 px-3 py-1.5 rounded-md text-xs font-bold border border-red-900/40 bg-red-950/30 hover:bg-red-950/60 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-yellow-400 hover:text-yellow-300 px-3 py-2 rounded-md text-sm font-black transition-colors"
                >
                  Portal Login
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-black rounded-md text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.35)] transition-all transform hover:scale-105 active:scale-95"
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
