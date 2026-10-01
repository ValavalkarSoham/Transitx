import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { busService, routeService, employeeService } from '../services/api';
import Map from '../components/Map';
import {
  Bus as BusIcon,
  Route as RouteIcon,
  Users,
  Layers,
  Plus,
  Trash2,
  Edit3,
  MapPin,
  X,
  Activity,
  Calendar,
  Briefcase,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Radio,
} from 'lucide-react';

const AdminDashboard = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  
  const [activeTab, setActiveTab] = useState('overview'); // overview, buses, routes, employees, live-map
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals / Form overlays
  const [busModalOpen, setBusModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  
  // Bus Form State
  const [busForm, setBusForm] = useState({
    id: null,
    busNumber: '',
    capacity: 40,
    routeId: '',
    driverId: '',
    status: 'inactive',
  });

  // Route Form State
  const [routeForm, setRouteForm] = useState({
    id: null,
    routeName: '',
    stops: [{ name: '', lat: '', lng: '' }],
  });

  // Employee Form State
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    designation: 'Driver',
    shiftStart: '09:00',
    shiftEnd: '17:00',
  });

  const socketRef = useRef(null);

  // Fetch all admin data
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const busRes = await busService.getBuses();
      const routeRes = await routeService.getRoutes();
      const empRes = await employeeService.getEmployees();
      const availEmpRes = await employeeService.getAvailableEmployees();

      if (busRes.success) setBuses(busRes.data);
      if (routeRes.success) setRoutes(routeRes.data);
      if (empRes.success) setEmployees(empRes.data);
      if (availEmpRes.success) setAvailableEmployees(availEmpRes.data);
    } catch (err) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to global socket updates for buses moving in real-time
    const socketServerUrl = import.meta.env.VITE_SOCKET_URL || 
      (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : null) || 
      (window.location.hostname === 'localhost' ? 'http://localhost:5001' : `http://${window.location.hostname}:5001`);
    
    socketRef.current = io(socketServerUrl);
    
    socketRef.current.on('globalLocationUpdate', ({ busId, lat, lng }) => {
      setBuses((prevBuses) =>
        prevBuses.map((bus) => {
          if (bus._id === busId) {
            return {
              ...bus,
              currentLocation: { lat, lng },
            };
          }
          return bus;
        })
      );
    });

    socketRef.current.on('tripStarted', ({ busId, status }) => {
      setBuses((prevBuses) =>
        prevBuses.map((bus) => {
          if (bus._id === busId) {
            return { ...bus, status };
          }
          return bus;
        })
      );
    });

    socketRef.current.on('tripEnded', ({ busId, status }) => {
      setBuses((prevBuses) =>
        prevBuses.map((bus) => {
          if (bus._id === busId) {
            return { ...bus, status };
          }
          return bus;
        })
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // --- Bus Actions ---
  const handleOpenAddBus = () => {
    setBusForm({
      id: null,
      busNumber: '',
      capacity: 40,
      routeId: '',
      driverId: '',
      status: 'inactive',
    });
    setBusModalOpen(true);
  };

  const handleOpenEditBus = (bus) => {
    setBusForm({
      id: bus._id,
      busNumber: bus.busNumber,
      capacity: bus.capacity,
      routeId: bus.routeId?._id || '',
      driverId: bus.driverId?._id || '',
      status: bus.status,
    });
    setBusModalOpen(true);
  };

  const handleSaveBus = async (e) => {
    e.preventDefault();
    try {
      const data = {
        busNumber: busForm.busNumber,
        capacity: Number(busForm.capacity),
        routeId: busForm.routeId || null,
        driverId: busForm.driverId || null,
        status: busForm.status,
      };

      if (busForm.id) {
        await busService.updateBus(busForm.id, data);
      } else {
        await busService.createBus(data);
      }
      setBusModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error saving bus');
    }
  };

  const handleDeleteBus = async (id) => {
    if (window.confirm('Are you sure you want to delete this bus?')) {
      try {
        await busService.deleteBus(id);
        loadData();
      } catch (err) {
        alert(err.message || 'Error deleting bus');
      }
    }
  };

  // --- Route Actions ---
  const handleOpenAddRoute = () => {
    setRouteForm({
      id: null,
      routeName: '',
      stops: [{ name: '', lat: '', lng: '' }],
    });
    setRouteModalOpen(true);
  };

  const handleOpenEditRoute = (route) => {
    setRouteForm({
      id: route._id,
      routeName: route.routeName,
      stops: route.stops.map(s => ({ name: s.name, lat: s.lat, lng: s.lng })),
    });
    setRouteModalOpen(true);
  };

  const handleAddStopInForm = () => {
    setRouteForm((prev) => ({
      ...prev,
      stops: [...prev.stops, { name: '', lat: '', lng: '' }],
    }));
  };

  const handleRemoveStopInForm = (index) => {
    setRouteForm((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));
  };

  const handleStopFieldChange = (index, field, value) => {
    const updatedStops = routeForm.stops.map((stop, i) => {
      if (i === index) {
        return { ...stop, [field]: value };
      }
      return stop;
    });
    setRouteForm((prev) => ({ ...prev, stops: updatedStops }));
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    try {
      const data = {
        routeName: routeForm.routeName,
        stops: routeForm.stops.map((s) => ({
          name: s.name,
          lat: Number(s.lat),
          lng: Number(s.lng),
        })),
      };

      if (routeForm.id) {
        await routeService.updateRoute(routeForm.id, data);
      } else {
        await routeService.createRoute(data);
      }
      setRouteModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error saving route');
    }
  };

  const handleDeleteRoute = async (id) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await routeService.deleteRoute(id);
        loadData();
      } catch (err) {
        alert(err.message || 'Error deleting route');
      }
    }
  };

  // --- Employee Actions ---
  const handleOpenAddEmployee = () => {
    setEmployeeForm({
      name: '',
      email: '',
      password: '',
      employeeId: '',
      designation: 'Driver',
      shiftStart: '09:00',
      shiftEnd: '17:00',
    });
    setEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      await employeeService.createEmployee(employeeForm);
      setEmployeeModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error creating employee');
    }
  };

  // Metrics
  const totalBuses = buses.length;
  const activeBuses = buses.filter((b) => b.status === 'active').length;
  const totalRoutes = routes.length;
  const totalEmployees = employees.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-zinc-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
              <ShieldCheck className="h-3.5 w-3.5" /> Fleet SuperAdmin
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              REALTIME SYNC
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-display">
            Admin <span className="text-yellow-400">Command Center</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage transport routes, registers, employee duty schedules, and watch active coordinates.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={loadData}
            className="inline-flex items-center px-4 py-2.5 border border-zinc-700/80 rounded-xl text-xs font-mono font-bold uppercase text-zinc-200 bg-zinc-900/90 hover:bg-zinc-800 hover:border-yellow-400/50 transition-all shadow-sm"
          >
            ↻ Refresh Registers
          </button>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#121214] p-5 rounded-2xl border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-yellow-400/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400"></div>
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Total Buses</span>
              <span className="text-3xl font-black text-yellow-400 mt-1 block font-mono tracking-tight">{totalBuses}</span>
            </div>
            <div className="p-3 bg-yellow-400/10 rounded-xl text-yellow-400 border border-yellow-400/20">
              <BusIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-[#121214] p-5 rounded-2xl border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400"></div>
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Active Duties</span>
              <span className="text-3xl font-black text-emerald-400 mt-1 block font-mono tracking-tight">{activeBuses}</span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="bg-[#121214] p-5 rounded-2xl border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-amber-400/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400"></div>
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Total Routes</span>
              <span className="text-3xl font-black text-amber-400 mt-1 block font-mono tracking-tight">{totalRoutes}</span>
            </div>
            <div className="p-3 bg-amber-400/10 rounded-xl text-amber-400 border border-amber-400/20">
              <RouteIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-[#121214] p-5 rounded-2xl border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-yellow-400/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400"></div>
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Staff Count</span>
              <span className="text-3xl font-black text-yellow-400 mt-1 block font-mono tracking-tight">{totalEmployees}</span>
            </div>
            <div className="p-3 bg-yellow-400/10 rounded-xl text-yellow-400 border border-yellow-400/20">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-zinc-800 mb-6">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
          {['overview', 'buses', 'routes', 'employees', 'live-map'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm tracking-wide capitalize transition-colors ${
                activeTab === tab
                  ? 'border-yellow-400 text-yellow-400 shadow-neon-yellow'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="text-center py-16 bg-[#121214] rounded-2xl border border-zinc-800">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto" />
          <p className="mt-3 text-sm font-mono text-zinc-400">Synchronizing fleet registers with telemetry server...</p>
        </div>
      ) : (
        <div>
          {/* Overview Panel */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bus Status Table Card */}
              <div className="bg-[#121214] p-6 rounded-2xl border border-zinc-800 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BusIcon className="h-5 w-5 text-yellow-400" />
                    Vehicles Status Overview
                  </h3>
                  <span className="text-xs font-mono text-zinc-500">{buses.length} registered</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-800 text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2.5 text-left text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Bus No.</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Route</th>
                        <th className="px-3 py-2.5 text-left text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {buses.map((bus) => (
                        <tr key={bus._id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-3 py-3 font-mono font-bold text-yellow-400">{bus.busNumber}</td>
                          <td className="px-3 py-3 text-zinc-300 truncate max-w-[150px]">
                            {bus.routeId?.routeName || <span className="text-zinc-600 italic">Unassigned</span>}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${
                                bus.status === 'active'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : bus.status === 'maintenance'
                                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              {bus.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Drivers & Route Info Card */}
              <div className="bg-[#121214] p-6 rounded-2xl border border-zinc-800 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-yellow-400" />
                      Employees & Transit Staff
                    </h3>
                    <span className="text-xs font-mono text-zinc-500">{employees.length} total staff</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                      <span className="font-semibold text-zinc-400">Total Registered Personnel</span>
                      <span className="font-mono font-black text-white text-base">{totalEmployees}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                      <span className="font-semibold text-zinc-400">Available (Unassigned to Bus)</span>
                      <span className="font-mono font-black text-yellow-400 text-base">{availableEmployees.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-zinc-800/80 pt-5">
                  <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                    Standby / Ready Drivers
                  </h4>
                  {availableEmployees.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">All drivers and employees are currently dispatched to active vehicles.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableEmployees.map((driver) => (
                        <span key={driver._id} className="text-xs bg-yellow-400/10 text-yellow-300 px-2.5 py-1 rounded-lg font-semibold border border-yellow-500/30 flex items-center gap-1.5">
                          <span>👤</span> {driver.name} <span className="text-[10px] text-zinc-400 font-mono">({driver.designation})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Buses CRUD Panel */}
          {activeTab === 'buses' && (
            <div className="bg-[#121214] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">Bus Fleet Management</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Register, modify specifications, or assign drivers to transit units</p>
                </div>
                <button
                  onClick={handleOpenAddBus}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-neon-yellow transition-all"
                >
                  <Plus className="h-4 w-4 mr-1 stroke-[3]" />
                  Add Bus
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-800 text-sm">
                  <thead className="bg-zinc-900/60">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Bus Number</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Capacity</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Assigned Route</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Assigned Staff</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-right text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {buses.map((bus) => (
                      <tr key={bus._id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-yellow-400">{bus.busNumber}</td>
                        <td className="px-6 py-4 text-zinc-300 font-mono">{bus.capacity} seats</td>
                        <td className="px-6 py-4 text-zinc-200 font-semibold">{bus.routeId?.routeName || <span className="text-zinc-600">—</span>}</td>
                        <td className="px-6 py-4 text-zinc-300">{bus.driverId?.name || <span className="text-zinc-600">—</span>}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                              bus.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : bus.status === 'maintenance'
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {bus.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditBus(bus)}
                            className="p-1.5 rounded-lg text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 transition-colors inline-flex items-center"
                            title="Edit Bus"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBus(bus._id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors inline-flex items-center"
                            title="Delete Bus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Routes CRUD Panel */}
          {activeTab === 'routes' && (
            <div className="bg-[#121214] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">Transport Routes</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Define stop coordinate sequences and route geometry</p>
                </div>
                <button
                  onClick={handleOpenAddRoute}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-neon-yellow transition-all"
                >
                  <Plus className="h-4 w-4 mr-1 stroke-[3]" />
                  Add Route
                </button>
              </div>

              <div className="divide-y divide-zinc-800/70">
                {routes.map((route) => (
                  <div key={route._id} className="p-6 hover:bg-zinc-800/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                    <div>
                      <h4 className="font-extrabold text-white text-base font-display">{route.routeName}</h4>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {route.stops.map((stop, i) => (
                          <React.Fragment key={stop._id || i}>
                            <span className="inline-flex items-center text-xs font-semibold bg-zinc-900 text-zinc-200 border border-zinc-700/80 rounded-lg px-2.5 py-1">
                              <MapPin className="h-3 w-3 text-yellow-400 mr-1" />
                              {stop.name}
                            </span>
                            {i < route.stops.length - 1 && <span className="text-yellow-400 font-bold text-xs">➔</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditRoute(route)}
                        className="p-2 border border-zinc-700/80 hover:border-yellow-400/50 text-yellow-400 rounded-xl bg-zinc-900 hover:bg-zinc-800 shadow-sm transition-colors"
                        title="Edit Route"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(route._id)}
                        className="p-2 border border-zinc-700/80 hover:border-red-400/50 text-red-400 rounded-xl bg-zinc-900 hover:bg-zinc-800 shadow-sm transition-colors"
                        title="Delete Route"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employees CRUD Panel */}
          {activeTab === 'employees' && (
            <div className="bg-[#121214] rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-yellow-400" />
                  Employee Register & Timings
                </h3>
                <button
                  onClick={handleOpenAddEmployee}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-neon-yellow transition-all"
                >
                  <Plus className="h-4 w-4 mr-1 stroke-[3]" />
                  Add Employee
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-800 text-sm">
                  <thead className="bg-zinc-900/60">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Employee ID</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Designation</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Shift / Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {employees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-yellow-400">{emp.employeeId || '—'}</td>
                        <td className="px-6 py-4 text-white font-semibold">{emp.name}</td>
                        <td className="px-6 py-4 text-zinc-400 font-mono text-xs">{emp.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-lg bg-yellow-400/10 text-yellow-400 text-xs font-mono font-bold border border-yellow-400/30">
                            {emp.designation || 'Driver'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-300 font-mono text-xs flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5 text-yellow-400" />
                          {emp.shiftStart} — {emp.shiftEnd}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Live Map Panel */}
          {activeTab === 'live-map' && (
            <div className="bg-[#121214] p-6 rounded-2xl border border-zinc-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Radio className="h-5 w-5 text-yellow-400 animate-pulse" />
                  Global Live Fleet Radar
                </h3>
                <span className="text-xs font-mono text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-2.5 py-1 rounded-full">
                  {buses.length} Fleet Nodes Monitored
                </span>
              </div>
              <div className="h-[480px] rounded-xl overflow-hidden border border-zinc-800">
                <Map allBuses={buses} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Bus Modal Form Overlay --- */}
      {busModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] rounded-2xl max-w-md w-full shadow-2xl border border-zinc-800 overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-extrabold text-white text-lg font-display">
                {busForm.id ? 'Edit Bus Properties' : 'Register New Bus'}
              </h3>
              <button onClick={() => setBusModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBus} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Bus Number / License Plate</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-01-F-1234"
                  value={busForm.busNumber}
                  onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Seating Capacity</label>
                <input
                  type="number"
                  required
                  min="5"
                  value={busForm.capacity}
                  onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Assign Route</label>
                <select
                  value={busForm.routeId}
                  onChange={(e) => setBusForm({ ...busForm, routeId: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                >
                  <option value="">-- No Assigned Route --</option>
                  {routes.map((route) => (
                    <option key={route._id} value={route._id}>
                      {route.routeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Assign Employee (Driver)</label>
                <select
                  value={busForm.driverId}
                  onChange={(e) => setBusForm({ ...busForm, driverId: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                >
                  <option value="">-- No Assigned Driver --</option>
                  
                  {busForm.id && buses.find(b => b._id === busForm.id)?.driverId && (
                    <option value={buses.find(b => b._id === busForm.id).driverId._id}>
                      {buses.find(b => b._id === busForm.id).driverId.name} (Currently Assigned)
                    </option>
                  )}

                  {availableEmployees.map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name} ({driver.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Vehicle Operational Status</label>
                <select
                  value={busForm.status}
                  onChange={(e) => setBusForm({ ...busForm, status: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                >
                  <option value="inactive">Inactive</option>
                  <option value="active">Active (On Route)</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setBusModalOpen(false)}
                  className="px-4 py-2 border border-zinc-700 rounded-xl text-sm font-semibold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-extrabold text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-neon-yellow transition-all"
                >
                  Save Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Route Modal Form Overlay --- */}
      {routeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-800 overflow-hidden max-h-[85vh] flex flex-col animate-fadeIn">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-extrabold text-white text-lg font-display">
                {routeForm.id ? 'Modify Route Definition' : 'Define New Route'}
              </h3>
              <button onClick={() => setRouteModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveRoute} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Route Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Route A - express"
                  value={routeForm.routeName}
                  onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Stops Coordinates Sequence</label>
                  <button
                    type="button"
                    onClick={handleAddStopInForm}
                    className="text-yellow-400 hover:text-yellow-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Stop
                  </button>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {routeForm.stops.map((stop, index) => (
                    <div key={index} className="flex gap-2 items-center bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl relative">
                      <span className="text-xs font-mono font-bold text-black bg-yellow-400 rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Stop Name"
                          value={stop.name}
                          onChange={(e) => handleStopFieldChange(index, 'name', e.target.value)}
                          className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
                        />
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="Latitude"
                          value={stop.lat}
                          onChange={(e) => handleStopFieldChange(index, 'lat', e.target.value)}
                          className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 font-mono"
                        />
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="Longitude"
                          value={stop.lng}
                          onChange={(e) => handleStopFieldChange(index, 'lng', e.target.value)}
                          className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 font-mono"
                        />
                      </div>

                      {routeForm.stops.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStopInForm(index)}
                          className="text-red-400 hover:text-red-300 p-1 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRouteModalOpen(false)}
                  className="px-4 py-2 border border-zinc-700 rounded-xl text-sm font-semibold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-extrabold text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-neon-yellow transition-all"
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Employee Modal Form Overlay --- */}
      {employeeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] rounded-2xl max-w-md w-full shadow-2xl border border-zinc-800 overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-extrabold text-white text-lg font-display">Register New Employee Staff</h3>
              <button onClick={() => setEmployeeModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mike Smith"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="mike@transitx.com"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={employeeForm.password}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="EMP021"
                    value={employeeForm.employeeId}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, employeeId: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Designation</label>
                  <select
                    value={employeeForm.designation}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors font-semibold"
                  >
                    <option value="Driver">Driver</option>
                    <option value="Conductor">Conductor</option>
                    <option value="Inspector">Inspector</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Shift Start</label>
                  <input
                    type="text"
                    required
                    placeholder="09:00"
                    value={employeeForm.shiftStart}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, shiftStart: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Shift End</label>
                  <input
                    type="text"
                    required
                    placeholder="17:00"
                    value={employeeForm.shiftEnd}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, shiftEnd: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEmployeeModalOpen(false)}
                  className="px-4 py-2 border border-zinc-700 rounded-xl text-sm font-semibold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-extrabold text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-neon-yellow transition-all"
                >
                  Create Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
