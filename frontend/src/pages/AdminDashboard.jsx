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
    socketRef.current = io('http://localhost:5001');
    
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage transport routes, registers, employee duty schedules, and watch active coordinates.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Total Buses</span>
            <span className="text-3xl font-black text-gray-950 mt-1 block">{totalBuses}</span>
          </div>
          <div className="p-3 bg-sky-50 rounded-full text-sky-600">
            <BusIcon className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Active Duties</span>
            <span className="text-3xl font-black text-green-600 mt-1 block">{activeBuses}</span>
          </div>
          <div className="p-3 bg-green-50 rounded-full text-green-600">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Total Routes</span>
            <span className="text-3xl font-black text-gray-950 mt-1 block">{totalRoutes}</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-full text-amber-600">
            <RouteIcon className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Total Employees</span>
            <span className="text-3xl font-black text-gray-950 mt-1 block">{totalEmployees}</span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
            <Users className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'buses', 'routes', 'employees', 'live-map'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Updating registers...</p>
        </div>
      ) : (
        <div>
          {/* Overview Panel */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bus Status Table Card */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Vehicles Overview</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-400 uppercase">Bus No.</th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-400 uppercase">Route</th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {buses.map((bus) => (
                        <tr key={bus._id}>
                          <td className="px-3 py-3 font-semibold text-gray-800">{bus.busNumber}</td>
                          <td className="px-3 py-3 text-gray-500 truncate max-w-[150px]">
                            {bus.routeId?.routeName || 'Unassigned'}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                bus.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : bus.status === 'maintenance'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-800'
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
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Employees & Staff</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-600">Total Registered Employees</span>
                      <span className="font-black text-gray-900">{totalEmployees}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-600">Available (Unassigned to Bus)</span>
                      <span className="font-black text-sky-600">{availableEmployees.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Available Employees List</h4>
                  {availableEmployees.length === 0 ? (
                    <p className="text-xs text-gray-400">All drivers/employees are currently mapped to buses.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableEmployees.map((driver) => (
                        <span key={driver._id} className="text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded font-semibold border border-sky-100">
                          👤 {driver.name} ({driver.designation})
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
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-950">Bus Fleet Management</h3>
                <button
                  onClick={handleOpenAddBus}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-semibold rounded-md text-white bg-sky-600 hover:bg-sky-700 shadow-sm"
                >
                  <Plus className="h-4.5 w-4.5 mr-1" />
                  Add Bus
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Bus Number</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Capacity</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Assigned Route</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Assigned Staff</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {buses.map((bus) => (
                      <tr key={bus._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-bold text-gray-900">{bus.busNumber}</td>
                        <td className="px-6 py-4 text-gray-600">{bus.capacity} seats</td>
                        <td className="px-6 py-4 text-gray-600 font-semibold">{bus.routeId?.routeName || '—'}</td>
                        <td className="px-6 py-4 text-gray-600">{bus.driverId?.name || '—'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                              bus.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : bus.status === 'maintenance'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {bus.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditBus(bus)}
                            className="text-sky-600 hover:text-sky-900 inline-flex items-center"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBus(bus._id)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center"
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
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-950">Transport Routes</h3>
                <button
                  onClick={handleOpenAddRoute}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-semibold rounded-md text-white bg-sky-600 hover:bg-sky-700 shadow-sm"
                >
                  <Plus className="h-4.5 w-4.5 mr-1" />
                  Add Route
                </button>
              </div>

              <div className="divide-y divide-gray-200">
                {routes.map((route) => (
                  <div key={route._id} className="p-6 hover:bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-base">{route.routeName}</h4>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {route.stops.map((stop, i) => (
                          <React.Fragment key={stop._id || i}>
                            <span className="inline-flex items-center text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 rounded px-2.5 py-1">
                              <MapPin className="h-3 w-3 text-sky-600 mr-1" />
                              {stop.name}
                            </span>
                            {i < route.stops.length - 1 && <span className="text-gray-300">➔</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditRoute(route)}
                        className="p-2 border border-gray-200 hover:border-sky-200 text-sky-600 rounded bg-white hover:bg-sky-50 shadow-sm transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(route._id)}
                        className="p-2 border border-gray-200 hover:border-red-200 text-red-600 rounded bg-white hover:bg-red-50 shadow-sm transition-colors"
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
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-950 font-sans flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-sky-600" />
                  Employee Register & Timings
                </h3>
                <button
                  onClick={handleOpenAddEmployee}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-semibold rounded-md text-white bg-sky-600 hover:bg-sky-700 shadow-sm"
                >
                  <Plus className="h-4.5 w-4.5 mr-1" />
                  Add Employee
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Employee ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Designation</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Shift / Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-250">
                    {employees.map((emp) => (
                      <tr key={emp._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-extrabold text-gray-900">{emp.employeeId || '—'}</td>
                        <td className="px-6 py-4 text-gray-800 font-semibold">{emp.name}</td>
                        <td className="px-6 py-4 text-gray-600">{emp.email}</td>
                        <td className="px-6 py-4 text-gray-600">
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-xs font-bold border border-sky-100">
                            {emp.designation || 'Driver'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-sky-600" />
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
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Global Live Fleet Tracker</h3>
              <div className="h-[450px]">
                <Map allBuses={buses} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Bus Modal Form Overlay --- */}
      {busModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 text-lg">
                {busForm.id ? 'Edit Bus Properties' : 'Register New Bus'}
              </h3>
              <button onClick={() => setBusModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBus} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Bus Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-01-F-1234"
                  value={busForm.busNumber}
                  onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Seating Capacity</label>
                <input
                  type="number"
                  required
                  min="5"
                  value={busForm.capacity}
                  onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Assign Route</label>
                <select
                  value={busForm.routeId}
                  onChange={(e) => setBusForm({ ...busForm, routeId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Assign Employee (Driver)</label>
                <select
                  value={busForm.driverId}
                  onChange={(e) => setBusForm({ ...busForm, driverId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Vehicle Status</label>
                <select
                  value={busForm.status}
                  onChange={(e) => setBusForm({ ...busForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="inactive">Inactive</option>
                  <option value="active">Active (Running)</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setBusModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm"
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
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-xl border border-gray-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 text-lg">
                {routeForm.id ? 'Modify Route Definition' : 'Define New Route'}
              </h3>
              <button onClick={() => setRouteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveRoute} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Route Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Route A - express"
                  value={routeForm.routeName}
                  onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase">Stops Coordinates Sequence</label>
                  <button
                    type="button"
                    onClick={handleAddStopInForm}
                    className="text-sky-600 hover:text-sky-700 text-xs font-bold flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-0.5" /> Add Stop
                  </button>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {routeForm.stops.map((stop, index) => (
                    <div key={index} className="flex gap-2 items-center bg-gray-50 border border-gray-200 p-3 rounded-lg relative">
                      <span className="text-xs font-bold text-gray-400 bg-gray-200 rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Stop Name"
                          value={stop.name}
                          onChange={(e) => handleStopFieldChange(index, 'name', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="Latitude"
                          value={stop.lat}
                          onChange={(e) => handleStopFieldChange(index, 'lat', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="Longitude"
                          value={stop.lng}
                          onChange={(e) => handleStopFieldChange(index, 'lng', e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      {routeForm.stops.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStopInForm(index)}
                          className="text-red-500 hover:text-red-700 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-150 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRouteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm"
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
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 text-lg">Register New Employee Staff</h3>
              <button onClick={() => setEmployeeModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mike Smith"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="mike@transitx.com"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={employeeForm.password}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    placeholder="EMP021"
                    value={employeeForm.employeeId}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, employeeId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Designation</label>
                  <select
                    value={employeeForm.designation}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                  >
                    <option value="Driver">Driver</option>
                    <option value="Conductor">Conductor</option>
                    <option value="Inspector">Inspector</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Shift Start</label>
                  <input
                    type="text"
                    required
                    placeholder="09:00"
                    value={employeeForm.shiftStart}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, shiftStart: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Shift End</label>
                  <input
                    type="text"
                    required
                    placeholder="17:00"
                    value={employeeForm.shiftEnd}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, shiftEnd: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEmployeeModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm"
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
