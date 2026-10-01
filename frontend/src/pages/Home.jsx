import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { routeService } from '../services/api';
import {
  Bus,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  Navigation,
  Search,
  HelpCircle,
  ChevronDown,
  CheckCircle,
  MapPin,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';

const Home = () => {
  const [routes, setRoutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [openFaq, setOpenFaq] = useState({});

  const routePrices = {
    'Route 1 - Marcel Line': 45000,
    'Route 2 - Bicholim Line': 45000,
    'Route 3 - Sanquelim Line': 45000,
    'Route 4 - Mapusa Line': 45000,
    'Route 5 - Porvorim Line': 45000,
    'Route 6 - Panjim Line': 40000,
    'Route 7 - Bambolim Line': 40000,
    'Route 8 - Vasco Line': 40000,
    'Route 9 - Ponda Line': 40000,
    'Route 10 - Old Goa Line': 40000,
    'Route 11 - Canacona Line': 35000,
    'Route 12 - Sanguem Line': 35000,
    'Route 13 - Curchorem Line': 35000,
    'Route 14 - Verna Line': 35000,
    'Route 15 - Cortalim Line': 35000,
    'Route 16 - Pillar Line': 35000,
    'Route 17 - Margao Line': 30000,
    'Route 18 - Quepem Line': 30000,
    'Route 19 - Cuncolim Line': 25000,
    'Route 20 - Chinchinim Line': 25000,
  };

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await routeService.getRoutes();
        if (res.success) {
          setRoutes(res.data);
        }
      } catch (err) {
        console.error('Error fetching routes:', err);
      }
    };
    fetchRoutes();
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq({ ...openFaq, [index]: !openFaq[index] });
  };

  const getPriceGroup = (routeName) => {
    const fee = routePrices[routeName] || 30000;
    if (fee === 45000) return 'Group 1';
    if (fee === 40000) return 'Group 2';
    if (fee === 35000) return 'Group 3';
    if (fee === 30000) return 'Group 4';
    return 'Group 5';
  };

  // Filter routes based on search and selected pricing group
  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.routeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.stops.some((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const grp = getPriceGroup(r.routeName);
    const matchesGroup = selectedGroup === 'All' || grp === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  const faqs = [
    {
      q: 'Where is the Parul University Goa campus located?',
      a: 'The college is located near ONGC Betul in Quitol, Taluka Quepem, South Goa, India. All 20 campus routes start from their respective hubs across North and South Goa and terminate at this campus.',
    },
    {
      q: 'How do I purchase a transport pass?',
      a: 'Register as a Student on the signup portal, log into your Student Space, navigate to the "Bus Plans Subscriptions" tab, select your route line, and process your mock payment to generate your digital QR pass instantly.',
    },
    {
      q: 'Can employees and drivers share live locations?',
      a: 'Yes! Registered Employees (Drivers/Conductors) have a dedicated panel where they can trigger "Start Location Sharing". This pushes real-time GPS updates over Socket.IO to students tracking the bus live.',
    },
    {
      q: 'Are the payments on this portal real?',
      a: 'No. TransitX features a fully mock, secure simulation payment gateway built to log tax invoices, receipts, and activate card passes for demonstration purposes.',
    },
  ];

  return (
    <div className="bg-[#09090b] min-h-[calc(100vh-4rem)] text-zinc-100 flex flex-col font-sans">
      
      {/* 1. Hero Section */}
      <div className="relative overflow-hidden border-b border-zinc-800/80 min-h-[560px] flex items-center bg-[#09090b]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 filter contrast-125"
        >
          <source src="/bg_video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Ambient Dark Overlay with Yellow Radial Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/90 to-[#09090b]/80 z-0"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="max-w-3xl text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-yellow-400 uppercase tracking-widest bg-yellow-400/10 px-3.5 py-1.5 rounded-full border border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
              <Zap className="h-3.5 w-3.5 text-yellow-400" />
              Smart Campus Transit System • Goa Edition
            </span>
            <h1 className="mt-5 text-4xl tracking-tight font-black text-white sm:text-5xl md:text-6xl leading-tight">
              Real-Time GPS Bus Tracking <br />
              <span className="text-yellow-400 neon-text-yellow">Engineered for Goa Campus</span>
            </h1>
            <p className="mt-5 text-base text-zinc-300 sm:text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
              TransitX maps all 20 pickup lines serving Parul University Goa campus at ONGC Betul, Quitol. Enjoy live GPS satellite tracking, proximity geofence chimes, instant digital QR passes, and driver telemetry.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-black rounded-lg text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.45)] transition-all transform hover:scale-105 active:scale-95 md:px-10"
              >
                <span>Portal Login</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/signup"
                className="flex items-center justify-center px-8 py-3.5 border border-zinc-700 text-sm font-black rounded-lg text-white bg-[#121214] hover:bg-zinc-800 hover:border-yellow-400/50 shadow-sm transition-all md:px-10"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Transport Fleet Statistics Counter */}
      <div className="bg-[#121214] border-b border-zinc-800/80 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-3">
              <span className="block text-3xl sm:text-4xl font-black text-yellow-400 neon-text-yellow">20</span>
              <span className="text-xs text-zinc-400 uppercase tracking-widest font-bold mt-1 block">Goa Route Lines</span>
            </div>
            <div className="p-3 border-l border-zinc-800">
              <span className="block text-3xl sm:text-4xl font-black text-white">100%</span>
              <span className="text-xs text-zinc-400 uppercase tracking-widest font-bold mt-1 block">Live GPS Covered</span>
            </div>
            <div className="p-3 border-l border-zinc-800">
              <span className="block text-3xl sm:text-4xl font-black text-yellow-400">₹25K+</span>
              <span className="text-xs text-zinc-400 uppercase tracking-widest font-bold mt-1 block">Pass Rates / Year</span>
            </div>
            <div className="p-3 border-l border-zinc-800">
              <span className="block text-2xl sm:text-3xl font-black text-white">ONGC Betul</span>
              <span className="text-xs text-zinc-400 uppercase tracking-widest font-bold mt-1 block">Campus Headquarters</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Core Portals Options */}
      <div className="py-20 bg-[#09090b] border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs text-yellow-400 font-black tracking-widest uppercase">CORE SHUTTLE PORTALS</h2>
            <p className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              User Portals Custom-Built for Every Role
            </p>
            <p className="text-zinc-400 text-sm mt-2 max-w-lg mx-auto">Access tailored workspaces designed exclusively for students, transit employees, and administrative fleet operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Student Space */}
            <div className="bg-[#121214] border border-zinc-800 p-8 rounded-2xl shadow-xl hover:border-yellow-400/50 hover:shadow-[0_0_25px_rgba(250,204,21,0.15)] transition-all hover:-translate-y-1 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 mb-6 group-hover:bg-yellow-400 group-hover:text-black transition-all">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-white">Student Space</h3>
                <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                  Access live coordinate tracking on interactive Goa Leaflet maps, trace pickup schedules, purchase subscription plans, arm proximity geofence radars, and scan your digital QR pass.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-zinc-800/80">
                <Link to="/login" className="text-xs font-black text-yellow-400 hover:text-yellow-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Open Student Space &rarr;
                </Link>
              </div>
            </div>

            {/* Employee Space */}
            <div className="bg-[#121214] border border-zinc-800 p-8 rounded-2xl shadow-xl hover:border-yellow-400/50 hover:shadow-[0_0_25px_rgba(250,204,21,0.15)] transition-all hover:-translate-y-1 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 mb-6 group-hover:bg-yellow-400 group-hover:text-black transition-all">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-white">Driver Panel</h3>
                <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                  Log in to review assigned bus timings and schedules. Drivers can toggle coordinate GPS broadcasting to push location telemetry to students and receive delay notices in real time.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-zinc-800/80">
                <Link to="/login" className="text-xs font-black text-yellow-400 hover:text-yellow-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Open Driver Panel &rarr;
                </Link>
              </div>
            </div>

            {/* Admin Space */}
            <div className="bg-[#121214] border border-zinc-800 p-8 rounded-2xl shadow-xl hover:border-yellow-400/50 hover:shadow-[0_0_25px_rgba(250,204,21,0.15)] transition-all hover:-translate-y-1 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 mb-6 group-hover:bg-yellow-400 group-hover:text-black transition-all">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-white">Admin Command Center</h3>
                <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                  Complete dashboard to manage bus fleets, seed and update routes, assign driver rosters, register student details, and verify global tracking metrics on the live Goa map.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-zinc-800/80">
                <Link to="/login" className="text-xs font-black text-yellow-400 hover:text-yellow-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Access Admin Command &rarr;
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Interactive Campus Route Explorer */}
      <div className="py-20 bg-[#09090b] border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs text-yellow-400 font-black tracking-widest uppercase">CAMPUS ROUTE SEARCH</h2>
            <p className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Search PU Goa Bus Routes & Pickup Timings
            </p>
            <p className="text-zinc-400 text-xs mt-2 max-w-lg mx-auto">Explore pickup sequences, stops, and pass rates for all 20 lines serving the Betul campus before logging in.</p>
          </div>

          {/* Search Controls */}
          <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-5 mb-8 max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4 shadow-xl">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search by route town or stop name (e.g. Mapusa, Vasco, Navelim)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-700 bg-[#09090b] rounded-xl text-xs text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full sm:w-48 py-2 px-3 border border-zinc-700 bg-[#09090b] rounded-xl text-xs text-white font-bold focus:border-yellow-400 outline-none"
              >
                <option value="All">All Price Groups</option>
                <option value="Group 1">Group 1 (₹45k PA)</option>
                <option value="Group 2">Group 2 (₹40k PA)</option>
                <option value="Group 3">Group 3 (₹35k PA)</option>
                <option value="Group 4">Group 4 (₹30k PA)</option>
                <option value="Group 5">Group 5 (₹25k PA)</option>
              </select>
            </div>
          </div>

          {/* Routes list */}
          {filteredRoutes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRoutes.map((r) => {
                const grp = getPriceGroup(r.routeName);
                const price = routePrices[r.routeName] || 30000;
                return (
                  <div key={r._id} className="bg-[#121214] border border-zinc-800 hover:border-yellow-400/40 p-6 rounded-2xl shadow-xl transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                            <Bus className="h-4 w-4 text-yellow-400 shrink-0" />
                          </div>
                          {r.routeName}
                        </h4>
                        <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 whitespace-nowrap">
                          {grp} • ₹{price.toLocaleString()}/yr
                        </span>
                      </div>

                      {/* Stops timeline */}
                      <div className="mt-4 space-y-1.5 text-xs text-zinc-400 pl-2 border-l-2 border-yellow-400/30">
                        {r.stops.map((stop, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 -ml-[9px] ring-4 ring-[#121214]"></span>
                            <span className={sIdx === 0 || sIdx === r.stops.length - 1 ? 'font-bold text-white' : ''}>
                              {stop.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-zinc-800/80 flex justify-between items-center text-[11px] text-zinc-400">
                      <span>Total Stops: <strong className="text-white">{r.stops.length}</strong></span>
                      <Link to="/login" className="text-yellow-400 font-black hover:text-yellow-300 flex items-center gap-1">
                        Track Live &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500">
              <Bus className="h-12 w-12 text-zinc-600 mx-auto mb-3 animate-pulse" />
              <p className="text-sm font-bold">No routes match your search criteria.</p>
              <p className="text-xs mt-1">Try searching for "Margao", "Panjim", "Mapusa", or clear your filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Frequently Asked Questions */}
      <div className="py-20 bg-[#121214] border-b border-zinc-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs text-yellow-400 font-black tracking-widest uppercase">FAQ DIRECTORY</h2>
            <p className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4 text-left">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                onClick={() => toggleFaq(idx)}
                className="bg-[#09090b] border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-yellow-400/40 transition-all shadow-md"
              >
                <div className="flex justify-between items-center gap-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-yellow-400 shrink-0" />
                    {faq.q}
                  </h4>
                  <ChevronDown
                    className={`h-4 w-4 text-yellow-400 transition-transform ${
                      openFaq[idx] ? 'transform rotate-180' : ''
                    }`}
                  />
                </div>
                {openFaq[idx] && (
                  <p className="mt-3 text-xs text-zinc-400 leading-relaxed pl-6 border-l-2 border-yellow-400/40">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
