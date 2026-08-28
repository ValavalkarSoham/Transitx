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
    <div className="bg-slate-950 min-h-[calc(100vh-4rem)] text-slate-100 flex flex-col">
      
      {/* 1. Hero Section */}
      <div className="relative overflow-hidden border-b border-slate-900 min-h-[550px] flex items-center bg-slate-950">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-55"
        >
          <source src="/bg_video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 w-full">
          <div className="max-w-3xl text-left">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest bg-sky-950/45 px-3 py-1 rounded-full border border-sky-900/50 shadow-lg">
              Smart Campus Transit System
            </span>
            <h1 className="mt-5 text-4xl tracking-tight font-black text-white sm:text-5xl md:text-6xl leading-tight">
              Real-Time GPS Bus Tracking <br />
              <span className="text-sky-400 neon-text-cyan">Made Seamless for Goa</span>
            </h1>
            <p className="mt-5 text-base text-slate-350 sm:text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
              TransitX maps all 20 pickup lines serving the Parul University Goa campus at ONGC Betul, Quitol. Enjoy real-time tracking, instant digital pass subscriptions, and driver schedules.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                className="flex items-center justify-center px-8 py-3 border border-sky-500/50 text-sm font-extrabold rounded-md text-white bg-sky-600 hover:bg-sky-750 shadow-lg neon-border-cyan animate-neon-pulse transition-all md:py-3.5 md:px-10"
              >
                Portal Login
              </Link>
              <Link
                to="/signup"
                className="flex items-center justify-center px-8 py-3 border border-slate-800 text-sm font-extrabold rounded-md text-slate-200 bg-slate-900/90 hover:bg-slate-850 shadow-sm transition-all md:py-3.5 md:px-10"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Transport Fleet Statistics Counter */}
      <div className="bg-slate-900 border-b border-slate-850 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-3">
              <span className="block text-3xl font-black text-sky-400">20</span>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1 block">Goa Route Lines</span>
            </div>
            <div className="p-3 border-l border-slate-800">
              <span className="block text-3xl font-black text-white">100%</span>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1 block">Live GPS Covered</span>
            </div>
            <div className="p-3 border-l border-slate-800">
              <span className="block text-3xl font-black text-white">₹25K+</span>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1 block">Pass Rates / Year</span>
            </div>
            <div className="p-3 border-l border-slate-800">
              <span className="block text-3xl font-black text-sky-400">ONGC Betul</span>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1 block">Campus Headquarters</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Core Portals Options */}
      <div className="py-20 bg-slate-950 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs text-sky-400 font-extrabold tracking-widest uppercase">CORE SHUTTLE PORTFOLIOS</h2>
            <p className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              User Portals Custom-Built for Roles
            </p>
            <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">Access tailored workspaces designed exclusively for students, transit employees, and administrative operations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Student Space */}
            <div className="bg-slate-900 border border-slate-800/80 p-8 rounded-xl shadow-lg hover:border-slate-700 transition-all hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-sky-950 text-sky-400 border border-sky-900/30 mb-6">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Student Space</h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  Access live coordinate tracking on interactive Goa Leaflet maps, trace pickup schedules, purchase subscription plans, view tax invoice logs, and scan your digital QR pass.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-850">
                <Link to="/login" className="text-xs font-black text-sky-400 hover:text-sky-300 flex items-center gap-1">
                  Open Student Space &rarr;
                </Link>
              </div>
            </div>

            {/* Employee Space */}
            <div className="bg-slate-900 border border-slate-800/80 p-8 rounded-xl shadow-lg hover:border-slate-700 transition-all hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-sky-950 text-sky-400 border border-sky-900/30 mb-6">
                  <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Employee Panel</h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  Log in to review assigned bus timings and schedules. Drivers can toggle coordinate GPS sharing to push location parameters to students live.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-850">
                <Link to="/login" className="text-xs font-black text-sky-400 hover:text-sky-300 flex items-center gap-1">
                  Open Employee Panel &rarr;
                </Link>
              </div>
            </div>

            {/* Admin Space */}
            <div className="bg-slate-900 border border-slate-800/80 p-8 rounded-xl shadow-lg hover:border-slate-700 transition-all hover:-translate-y-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-sky-950 text-sky-400 border border-sky-900/30 mb-6">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Admin Command Center</h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  Complete dashboard to manage bus fleets, seed and update routes, assign driver rosters, register student details, and verify tracking metrics.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-850">
                <Link to="/login" className="text-xs font-black text-sky-400 hover:text-sky-300 flex items-center gap-1">
                  Access Admin Command &rarr;
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Interactive Campus Route Explorer */}
      <div className="py-20 bg-slate-950 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs text-sky-400 font-extrabold tracking-widest uppercase">CAMPUS ROUTE SEARCH</h2>
            <p className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Search PU Goa Bus Routes & Pickup Timings
            </p>
            <p className="text-slate-400 text-xs mt-2 max-w-lg mx-auto">Explore pickup sequences, stops, and pass rates for all 20 lines serving the Betul campus before logging in.</p>
          </div>

          {/* Search Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by route town or stop name (e.g. Mapusa, Vasco, Navelim)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-850 bg-slate-950 rounded-lg text-xs text-white focus:ring-1 focus:ring-sky-500"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full sm:w-44 py-1.5 px-3 border border-slate-850 bg-slate-950 rounded-lg text-xs text-white font-bold"
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
                  <div key={r._id} className="bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-xl shadow-lg transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Bus className="h-4 w-4 text-sky-400 shrink-0" />
                          {r.routeName}
                        </h4>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                          grp === 'Group 1' ? 'bg-red-950/40 text-red-400 border border-red-900/35' :
                          grp === 'Group 2' ? 'bg-orange-950/40 text-orange-400 border border-orange-900/35' :
                          grp === 'Group 3' ? 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/35' :
                          grp === 'Group 4' ? 'bg-sky-950/40 text-sky-400 border border-sky-900/35' :
                          'bg-green-950/40 text-green-400 border border-green-900/35'
                        }`}>
                          {grp} (₹{price.toLocaleString()} PA)
                        </span>
                      </div>

                      <div className="space-y-2 mt-4 pl-1">
                        <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Stops & Schedule Sequence</span>
                        <div className="border-l border-slate-800 pl-4 ml-1.5 space-y-3 relative">
                          {r.stops.map((stop, idx) => (
                            <div key={idx} className="relative flex items-center justify-between text-xs">
                              {/* Dot */}
                              <div className={`absolute -left-[20.5px] h-2 w-2 rounded-full border ${
                                stop.name.includes('Quitol') ? 'bg-sky-500 border-sky-400' : 'bg-slate-950 border-slate-700'
                              }`}></div>
                              
                              <span className={`font-semibold ${stop.name.includes('Quitol') ? 'text-sky-400 font-extrabold' : 'text-slate-300'}`}>
                                {stop.name}
                              </span>
                              {idx < r.stops.length - 1 && (
                                <span className="text-[10px] text-slate-500 font-bold">
                                  Pickup
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 font-bold text-xs bg-slate-900 border border-slate-800 rounded-xl max-w-xl mx-auto">
              <span>No matching routes or pickup stops found.</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. FAQs Accordion */}
      <div className="py-20 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <HelpCircle className="h-10 w-10 text-sky-400 mx-auto mb-2" />
            <h2 className="text-2xl font-black text-white sm:text-3xl">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-xs mt-1.5">Quick references to guide you through pass registrations and live operations.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-850 rounded-xl overflow-hidden shadow-md">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left text-xs font-bold text-slate-200 hover:text-white transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4.5 w-4.5 text-slate-500 transition-transform ${openFaq[idx] ? 'rotate-180 text-sky-400' : ''}`} />
                </button>

                {openFaq[idx] && (
                  <div className="px-6 pb-5 pt-1 border-t border-slate-850/50">
                    <p className="text-xs text-slate-400 leading-relaxed font-semibold">{faq.a}</p>
                  </div>
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
