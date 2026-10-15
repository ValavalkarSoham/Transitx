import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { busService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Map from '../components/Map';
import {
  Play,
  Square,
  MapPin,
  AlertTriangle,
  Compass,
  RefreshCw,
  Briefcase,
  Calendar,
  Bell,
  Radio,
  Satellite,
  ShieldAlert,
  CheckCircle,
  Navigation,
  Activity,
  Users,
  Gauge,
  Clock,
  CloudRain,
  Send,
  Zap,
  PhoneCall,
  Check,
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTripActive, setIsTripActive] = useState(false);
  const [simLocation, setSimLocation] = useState(null);
  const [trackingMode, setTrackingMode] = useState('simulated'); // 'simulated' | 'gps'
  const [simStatusMsg, setSimStatusMsg] = useState('Idle');
  const [lateNotices, setLateNotices] = useState([]);
  
  // Passenger seat occupancy telemetry
  const [seatsOccupied, setSeatsOccupied] = useState(22);
  const [broadcastNotice, setBroadcastNotice] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const [gpsTelemetry, setGpsTelemetry] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: null,
    lastPing: null,
    error: null,
    isTesting: false,
  });

  const socketRef = useRef(null);
  const simIntervalRef = useRef(null);
  const watchIdRef = useRef(null);

  // Fetch the bus assigned to this employee
  const fetchMyBus = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await busService.getMyBus();
      if (res.success) {
        setBus(res.data);
        if (res.data.status === 'active') {
          setIsTripActive(true);
        }
        setSimLocation({
          busId: res.data._id,
          busNumber: res.data.busNumber,
          lat: res.data.currentLocation.lat,
          lng: res.data.currentLocation.lng,
        });
      } else {
        setError('Failed to fetch assigned bus details.');
      }
    } catch (err) {
      setError(err.message || 'No bus assigned or error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBus();
  }, []);

  useEffect(() => {
    return () => {
      stopSimulation();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Helper to interpolate points between two coordinates for smooth simulation
  const interpolatePoints = (p1, p2, steps) => {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps;
      const lat = p1.lat + (p2.lat - p1.lat) * fraction;
      const lng = p1.lng + (p2.lng - p1.lng) * fraction;
      points.push({ lat, lng });
    }
    return points;
  };

  const startSimulation = () => {
    if (!bus || !bus.routeId || bus.routeId.stops.length < 2) return;

    const socketServerUrl = import.meta.env.VITE_SOCKET_URL || 
      (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : null) || 
      (window.location.hostname === 'localhost' ? 'http://localhost:5001' : `http://${window.location.hostname}:5001`);
    
    socketRef.current = io(socketServerUrl);
    
    // Notify server trip has started
    socketRef.current.emit('startTrip', { busId: bus._id });

    // Listen for late notifications from passengers
    socketRef.current.on('lateNoticeReceived', (notice) => {
      console.log('Driver received late notice:', notice);
      setLateNotices((prev) => [notice, ...prev]);
    });

    setIsTripActive(true);
    busService.updateBus(bus._id, { status: 'active' }).then(fetchMyBus).catch(console.error);

    if (trackingMode === 'gps') {
      startRealGpsTracking();
    } else {
      startSimulatedInterpolation();
    }
  };

  const startRealGpsTracking = () => {
    if (!('geolocation' in navigator)) {
      setSimStatusMsg('Geolocation not supported on this device');
      return;
    }

    setSimStatusMsg('Locking onto device GPS satellites...');

    const handleGpsPosition = (position) => {
      const { latitude, longitude, accuracy, speed } = position.coords;
      const speedKmh = speed !== null ? Math.round(speed * 3.6) : 38;
      const accuracyMeters = Math.round(accuracy);

      setGpsTelemetry({
        latitude,
        longitude,
        accuracy: accuracyMeters,
        speed: speedKmh,
        lastPing: new Date().toLocaleTimeString(),
        error: null,
        isTesting: false,
      });

      setSimLocation({
        busId: bus._id,
        busNumber: bus.busNumber,
        lat: latitude,
        lng: longitude,
      });

      if (socketRef.current) {
        socketRef.current.emit('updateLocation', {
          busId: bus._id,
          lat: latitude,
          lng: longitude,
          speed: speedKmh,
          accuracy: accuracyMeters,
        });
      }

      setSimStatusMsg(`Broadcasting GPS (${speedKmh} km/h • ±${accuracyMeters}m)`);
    };

    const handleGpsError = (err) => {
      console.warn('GPS WatchPosition warning:', err.message);
      setGpsTelemetry((prev) => ({
        ...prev,
        error: `GPS Signal Warning: ${err.message}. Retrying...`,
      }));
      setSimStatusMsg('GPS Signal Searching...');
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleGpsPosition,
      handleGpsError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const startSimulatedInterpolation = () => {
    const stops = bus.routeId.stops;
    let fullRoutePoints = [];
    const stepsBetweenStops = 15;

    for (let i = 0; i < stops.length - 1; i++) {
      const segPoints = interpolatePoints(stops[i], stops[i + 1], stepsBetweenStops);
      if (i > 0) segPoints.shift();
      fullRoutePoints = [...fullRoutePoints, ...segPoints];
    }

    let currentIndex = 0;
    setSimStatusMsg('Broadcasting along simulated route coordinates');

    simIntervalRef.current = setInterval(() => {
      if (currentIndex >= fullRoutePoints.length) {
        currentIndex = 0;
      }

      const point = fullRoutePoints[currentIndex];

      setSimLocation({
        busId: bus._id,
        busNumber: bus.busNumber,
        lat: point.lat,
        lng: point.lng,
      });

      if (socketRef.current) {
        socketRef.current.emit('updateLocation', {
          busId: bus._id,
          lat: point.lat,
          lng: point.lng,
        });
      }

      setSimStatusMsg(
        `Waypoint ${currentIndex + 1}/${fullRoutePoints.length} (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})`
      );

      currentIndex++;
    }, 2500);
  };

  const testDeviceGps = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser/device.');
      return;
    }

    setGpsTelemetry((prev) => ({ ...prev, isTesting: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed } = pos.coords;
        setGpsTelemetry({
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          speed: speed !== null ? Math.round(speed * 3.6) : 0,
          lastPing: new Date().toLocaleTimeString(),
          error: null,
          isTesting: false,
        });
      },
      (err) => {
        setGpsTelemetry((prev) => ({
          ...prev,
          isTesting: false,
          error: `Fix Failed (${err.code}): ${err.message}`,
        }));
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const stopSimulation = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.emit('stopTrip', { busId: bus?._id });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsTripActive(false);
    setSimStatusMsg('Stopped');
    setLateNotices([]);
    
    if (bus) {
      busService.updateBus(bus._id, { status: 'inactive' }).then(fetchMyBus).catch(console.error);
    }
  };

  const handleTripToggle = () => {
    if (isTripActive) {
      stopSimulation();
    } else {
      startSimulation();
    }
  };

  // Broadcast road delay / incident alert to students
  const handleBroadcastAlert = (msg) => {
    setBroadcastNotice(msg);
    if (socketRef.current && bus) {
      socketRef.current.emit('driverBroadcast', {
        busId: bus._id,
        busNumber: bus.busNumber,
        routeName: bus.routeId?.routeName,
        message: msg,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-[#09090b]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest mt-2">Loading duty telemetry...</span>
        </div>
      </div>
    );
  }

  // Standby Driver Lounge when unassigned
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 font-sans text-zinc-100">
        <div className="bg-[#121214] rounded-2xl shadow-2xl border border-zinc-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="h-16 w-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="h-8 w-8" />
          </div>

          <span className="px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 text-[10px] font-mono font-bold uppercase tracking-wider">
            DRIVER STANDBY LOUNGE • TRANSITX
          </span>

          <h2 className="text-2xl font-black text-white mt-3 mb-2">Welcome to Duty Standby, {user?.name || 'Driver'}</h2>
          <p className="text-zinc-400 text-xs max-w-lg mx-auto mb-6 leading-relaxed">
            You are logged in with Employee ID: <strong className="text-yellow-400 font-mono">{user?.employeeId || 'EMP-ACTIVE'}</strong>. You are currently on reserve standby until a vehicle is assigned by the Fleet Administrator.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8 max-w-2xl mx-auto">
            <div className="p-4 bg-[#09090b] rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Scheduled Shift</span>
              <span className="text-xs font-bold text-white mt-1 block">{user?.shiftStart || '09:00'} — {user?.shiftEnd || '17:00'}</span>
            </div>
            <div className="p-4 bg-[#09090b] rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Designation</span>
              <span className="text-xs font-bold text-yellow-400 mt-1 block">{user?.designation || 'Transit Operator'}</span>
            </div>
            <div className="p-4 bg-[#09090b] rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Dispatch Desk</span>
              <span className="text-xs font-bold text-white mt-1 block">+91 832 2700000</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={fetchMyBus}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-xs font-black text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.35)] transition-all"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Fleet Assignment
            </button>
            <a
              href="tel:+918322700000"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-xs font-bold text-zinc-300 bg-[#09090b] border border-zinc-700 hover:border-yellow-400/50 transition-all"
            >
              <PhoneCall className="h-4 w-4 mr-2 text-yellow-400" />
              Call Fleet Dispatcher
            </a>
          </div>
        </div>
      </div>
    );
  }

  const busCapacity = bus.capacity || 40;
  const occupancyPercent = Math.min(100, Math.round((seatsOccupied / busCapacity) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 font-sans bg-[#09090b] text-zinc-100">
      
      {/* Simulation Controls & Driver Cockpit Panel */}
      <div className="w-full lg:w-96 bg-[#121214] p-6 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col justify-between shrink-0 text-left space-y-6">
        <div>
          <span className="block text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            Driver Cockpit Telemetry
          </span>
          <h2 className="text-2xl font-black text-white border-b border-zinc-800 pb-3">
            {user?.name}
          </h2>
          <p className="text-xs text-zinc-400 font-semibold mt-1.5">
            Role ID: <span className="font-extrabold text-yellow-400">{user?.employeeId || 'N/A'}</span> | Post:{' '}
            <span className="font-extrabold text-white">{user?.designation || 'Driver'}</span>
          </p>

          <div className="space-y-3 mt-6">
            
            {/* Shift Card */}
            <div className="p-3.5 bg-yellow-400/10 rounded-xl border border-yellow-400/30 flex items-start gap-2.5">
              <Calendar className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Assigned Shift (Duty Schedule)</span>
                <span className="text-sm font-black text-white">
                  {user?.shiftStart} — {user?.shiftEnd} (Mon - Fri)
                </span>
              </div>
            </div>

            {/* Vehicle Card */}
            <div className="p-3.5 bg-[#09090b] rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-zinc-400 font-bold uppercase">Bus Assigned</span>
                <span className="text-base font-black text-yellow-400 block mt-0.5 font-mono">{bus.busNumber}</span>
                <span className="text-xs text-zinc-400 font-semibold block mt-0.5">{bus.routeId?.routeName || 'None'}</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 font-mono text-xs font-bold">
                {busCapacity} Seats
              </span>
            </div>

            {/* Live Telemetry Gauges (Speed & Broadcast) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-[#09090b] rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1">
                  <Gauge className="h-3 w-3 text-yellow-400" />
                  Speedometer
                </span>
                <span className="text-lg font-black text-white font-mono mt-1 block">
                  {isTripActive ? (gpsTelemetry.speed || 38) : 0} <span className="text-xs text-yellow-400">km/h</span>
                </span>
              </div>

              <div className="p-3 bg-[#09090b] rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1">
                  <Activity className="h-3 w-3 text-emerald-400" />
                  Trip Status
                </span>
                <span className={`text-xs font-black font-mono mt-1.5 block uppercase ${isTripActive ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`}>
                  {isTripActive ? 'BROADCASTING' : 'IDLE / OFF'}
                </span>
              </div>
            </div>

            {/* Passenger Seat Occupancy Tool */}
            <div className="p-3.5 bg-[#09090b] rounded-xl border border-zinc-800">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-yellow-400" />
                  Seat Occupancy
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  occupancyPercent > 85 ? 'bg-red-500/20 text-red-400' : occupancyPercent > 60 ? 'bg-yellow-400/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {occupancyPercent}% Filled
                </span>
              </div>

              <div className="w-full bg-zinc-800 rounded-full h-2 mb-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    occupancyPercent > 85 ? 'bg-red-500' : occupancyPercent > 60 ? 'bg-yellow-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${occupancyPercent}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-white">{seatsOccupied} / {busCapacity} Passengers</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSeatsOccupied((p) => Math.max(0, p - 1))}
                    className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-center flex items-center justify-center"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeatsOccupied((p) => Math.min(busCapacity, p + 1))}
                    className="h-6 w-6 rounded bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-center flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Tracking Mode Toggle */}
            <div className="p-3.5 bg-[#09090b] rounded-xl border border-zinc-800">
              <span className="block text-[10px] text-zinc-400 font-bold uppercase mb-2">Tracking Engine Mode</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isTripActive}
                  onClick={() => setTrackingMode('simulated')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border ${
                    trackingMode === 'simulated'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                      : 'border-zinc-800 text-zinc-400 hover:text-white'
                  } disabled:opacity-50`}
                >
                  SIMULATION
                </button>
                <button
                  type="button"
                  disabled={isTripActive}
                  onClick={() => setTrackingMode('gps')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border ${
                    trackingMode === 'gps'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                      : 'border-zinc-800 text-zinc-400 hover:text-white'
                  } disabled:opacity-50`}
                >
                  GENUINE GPS
                </button>
              </div>

              {/* GPS Mode Diagnostics */}
              {trackingMode === 'gps' && (
                <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1">
                      <Satellite className="h-3 w-3 text-yellow-400 animate-pulse" />
                      Hardware GPS Telemetry
                    </span>
                    {!isTripActive && (
                      <button
                        type="button"
                        onClick={testDeviceGps}
                        disabled={gpsTelemetry.isTesting}
                        className="text-[9px] font-black uppercase px-2 py-0.5 border border-yellow-400/40 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 transition-all rounded"
                      >
                        {gpsTelemetry.isTesting ? 'Testing...' : 'Test Fix'}
                      </button>
                    )}
                  </div>

                  {gpsTelemetry.latitude ? (
                    <div className="font-mono text-[10px] text-zinc-300 space-y-0.5">
                      <div>Coord: {gpsTelemetry.latitude.toFixed(5)}, {gpsTelemetry.longitude.toFixed(5)}</div>
                      <div>Accuracy: ±{gpsTelemetry.accuracy}m | Ping: {gpsTelemetry.lastPing}</div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span>Click Start or "Test Fix" to lock physical GPS coordinates.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Start / Stop Trip Button */}
        <div>
          <button
            onClick={handleTripToggle}
            className={`w-full py-4 px-6 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
              isTripActive
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black shadow-[0_0_25px_rgba(250,204,21,0.45)]'
            }`}
          >
            {isTripActive ? (
              <>
                <Square className="h-5 w-5 fill-current" />
                Stop Broadcast Engine
              </>
            ) : (
              <>
                <Play className="h-5 w-5 fill-current" />
                Ignition — Start Share
              </>
            )}
          </button>

          <p className="mt-2 text-center text-[10px] text-zinc-400 font-medium">
            {isTripActive
              ? 'Trip is running. Broadcasting GPS coordinates along the stops in real-time.'
              : 'Click Start to open Socket channels and share your bus location with passengers.'}
          </p>
        </div>
      </div>

      {/* Driver Map Preview & Operations Feed */}
      <div className="flex-1 bg-[#121214] p-6 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col justify-between overflow-hidden text-left space-y-4">
        
        {/* Map Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Compass className="h-5 w-5 text-yellow-400" />
            Duty Path Tracker Map
          </h3>
          <span className="text-xs text-zinc-400 font-bold">
            Total Stops: <strong className="text-yellow-400">{bus.routeId?.stops.length || 0}</strong>
          </span>
        </div>

        {/* Map View */}
        <div className="flex-1 min-h-[340px] rounded-xl overflow-hidden border border-zinc-800">
          <Map
            activeBusLocation={isTripActive ? simLocation : null}
            routeStops={bus.routeId?.stops || []}
          />
        </div>

        {/* Driver Incident & Delay Broadcaster */}
        <div className="p-4 bg-[#09090b] rounded-xl border border-zinc-800">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Quick Passenger Road Broadcasts
            </span>
            {broadcastSent && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <Check className="h-3 w-3" /> Broadcast Sent to Passengers!
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleBroadcastAlert('Heavy Traffic Congestion (+10 min delay)')}
              className="p-2 bg-[#121214] hover:bg-yellow-400/10 border border-zinc-800 hover:border-yellow-400/50 rounded-lg text-[10px] font-bold text-zinc-300 text-left transition-all"
            >
              ⚠️ Traffic Jam (+10m)
            </button>
            <button
              type="button"
              onClick={() => handleBroadcastAlert('Heavy Rain & Low Visibility (+15 min delay)')}
              className="p-2 bg-[#121214] hover:bg-yellow-400/10 border border-zinc-800 hover:border-yellow-400/50 rounded-lg text-[10px] font-bold text-zinc-300 text-left transition-all"
            >
              🌧️ Heavy Rain (+15m)
            </button>
            <button
              type="button"
              onClick={() => handleBroadcastAlert('Quick Technical Checkpoint (+5 min delay)')}
              className="p-2 bg-[#121214] hover:bg-yellow-400/10 border border-zinc-800 hover:border-yellow-400/50 rounded-lg text-[10px] font-bold text-zinc-300 text-left transition-all"
            >
              🔧 Tech Check (+5m)
            </button>
            <button
              type="button"
              onClick={() => handleBroadcastAlert('Clear Road Ahead (Bus Running On-Schedule)')}
              className="p-2 bg-[#121214] hover:bg-emerald-500/10 border border-zinc-800 hover:border-emerald-500/50 rounded-lg text-[10px] font-bold text-emerald-400 text-left transition-all"
            >
              🟢 Route Clear (On-Time)
            </button>
          </div>
        </div>

        {/* Route Stops Sequence */}
        {bus.routeId && (
          <div className="pt-2">
            <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">Route Stop Sequence</h4>
            <div className="flex flex-wrap gap-2">
              {bus.routeId.stops.map((stop, i) => (
                <div
                  key={stop._id}
                  className="flex items-center text-xs bg-[#09090b] border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 font-semibold"
                >
                  <MapPin className="h-3.5 w-3.5 text-yellow-400 mr-1 shrink-0" />
                  {i + 1}. {stop.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student Late Notices Feed */}
        <div className="pt-3 border-t border-zinc-800">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-red-500 animate-bounce" />
            Passenger Delay Notifications ({lateNotices.length})
          </h4>
          {lateNotices.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {lateNotices.map((notice, idx) => (
                <div key={idx} className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300 flex justify-between items-center animate-pulse">
                  <div>
                    <span className="font-black text-white block">{notice.studentName}</span>
                    <span className="text-[10px] text-zinc-400 font-medium">Roll: {notice.rollNumber} | Stop: {notice.stopName}</span>
                  </div>
                  <span className="bg-red-500 text-black px-2 py-0.5 rounded font-black text-[10px] uppercase">
                    +{notice.delayMinutes} mins
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-[#09090b] border border-zinc-800 rounded-xl text-center text-xs text-zinc-500 font-medium">
              No delay notifications received from passengers.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboard;
