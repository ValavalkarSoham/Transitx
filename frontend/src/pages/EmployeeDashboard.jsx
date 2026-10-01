import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { busService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Map from '../components/Map';
import { Play, Square, MapPin, AlertTriangle, Compass, RefreshCw, Briefcase, Calendar, Bell, Radio, Satellite, ShieldAlert, CheckCircle, Navigation, Activity } from 'lucide-react';

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
      const speedKmh = speed !== null ? Math.round(speed * 3.6) : 0;
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

      // Emit locationUpdate & busLocation events to server
      if (socketRef.current) {
        socketRef.current.emit('locationUpdate', {
          busId: bus._id,
          busNumber: bus.busNumber,
          lat: latitude,
          lng: longitude,
          accuracy: accuracyMeters,
          speed: speedKmh,
        });
        socketRef.current.emit('busLocation', {
          busId: bus._id,
          busNumber: bus.busNumber,
          lat: latitude,
          lng: longitude,
        });
      }

      setSimStatusMsg(`Broadcasting Device GPS: (±${accuracyMeters}m @ ${speedKmh}km/h)`);
    };

    const handleGpsError = (err) => {
      console.warn('GPS Error (High accuracy):', err);
      setGpsTelemetry((prev) => ({
        ...prev,
        error: `GPS Error (${err.code}): ${err.message}`,
        isTesting: false,
      }));

      // Fallback without high accuracy if GPS timed out
      if (err.code === 3) {
        setSimStatusMsg('High-accuracy GPS timed out. Retrying standard fix...');
        navigator.geolocation.getCurrentPosition(
          handleGpsPosition,
          (err2) => setSimStatusMsg(`GPS Error: ${err2.message}`),
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 5000 }
        );
      } else {
        setSimStatusMsg(`GPS Fix Error: ${err.message}`);
      }
    };

    // Immediate initial coordinate fix
    navigator.geolocation.getCurrentPosition(handleGpsPosition, handleGpsError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // Continuous watchPosition streaming
    watchIdRef.current = navigator.geolocation.watchPosition(handleGpsPosition, handleGpsError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000,
    });
  };

  const testDeviceGps = () => {
    if (!('geolocation' in navigator)) {
      alert('HTML5 Geolocation is not supported in this browser.');
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
          error: `Test Error: ${err.message}`,
          isTesting: false,
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startSimulatedInterpolation = () => {
    const stops = bus.routeId.stops;
    let path = [];

    // Interpolate 10 points between each stop
    for (let i = 0; i < stops.length - 1; i++) {
      const segment = interpolatePoints(stops[i], stops[i + 1], 10);
      path = path.concat(segment);
    }

    let currentIndex = 0;
    setSimStatusMsg('Broadcasting Simulated Route Coordinates...');

    simIntervalRef.current = setInterval(() => {
      if (currentIndex >= path.length) {
        currentIndex = 0; // Loop simulation
      }

      const currentCoord = path[currentIndex];
      setSimLocation({
        busId: bus._id,
        busNumber: bus.busNumber,
        lat: currentCoord.lat,
        lng: currentCoord.lng,
      });

      // Update telemetry state
      setGpsTelemetry((prev) => ({
        ...prev,
        latitude: currentCoord.lat,
        longitude: currentCoord.lng,
        accuracy: 5,
        speed: 35,
        lastPing: new Date().toLocaleTimeString(),
        error: null,
      }));

      // Emit locationUpdate & busLocation events to server
      if (socketRef.current) {
        socketRef.current.emit('locationUpdate', {
          busId: bus._id,
          busNumber: bus.busNumber,
          lat: currentCoord.lat,
          lng: currentCoord.lng,
        });
        socketRef.current.emit('busLocation', {
          busId: bus._id,
          busNumber: bus.busNumber,
          lat: currentCoord.lat,
          lng: currentCoord.lng,
        });
      }

      const progressPercent = Math.min(100, Math.round(((currentIndex + 1) / path.length) * 100));
      setSimStatusMsg(`Broadcasting Route Position... (${progressPercent}% of Route Completed)`);

      currentIndex++;
    }, 2000);
  };

  const stopSimulation = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    if (watchIdRef.current !== null) {
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

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-[#121214] rounded-2xl shadow-2xl border border-zinc-800 text-center font-sans">
        <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-xl font-black text-white mb-2">Access Issue / Unassigned</h2>
        <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{error}</p>
        <p className="text-xs text-zinc-500 mb-6 max-w-md mx-auto">
          You are registered as an employee, but you have not yet been mapped to a bus by the administrator. Please request the admin to map your account in the Admin console.
        </p>
        <button
          onClick={fetchMyBus}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-xs font-black text-black bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.35)] transition-all"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Check Assignment
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 font-sans bg-[#09090b] text-zinc-100">
      {/* Simulation Controls Panel */}
      <div className="w-full lg:w-96 bg-[#121214] p-6 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col justify-between shrink-0 text-left">
        <div>
          <span className="block text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            Driver Panel Dashboard
          </span>
          <h2 className="text-2xl font-black text-white border-b border-zinc-800 pb-3">
            {user?.name}
          </h2>
          <p className="text-xs text-zinc-400 font-semibold mt-1.5">
            Role ID: <span className="font-extrabold text-yellow-400">{user?.employeeId || 'N/A'}</span> | Post:{' '}
            <span className="font-extrabold text-white">{user?.designation || 'N/A'}</span>
          </p>

          <div className="space-y-3 mt-6 mb-8">
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
            <div className="p-3.5 bg-[#09090b] rounded-xl border border-zinc-800">
              <span className="block text-[10px] text-zinc-400 font-bold uppercase">Bus Assigned</span>
              <span className="text-sm font-black text-yellow-400 block mt-0.5">{bus.busNumber}</span>
              <span className="text-xs text-zinc-400 font-semibold block mt-0.5">Capacity: {bus.capacity} seats</span>
            </div>

            {/* Route Card */}
            <div className="p-3.5 bg-[#09090b] rounded-xl border border-zinc-800">
              <span className="block text-[10px] text-zinc-400 font-bold uppercase">Assigned Route</span>
              <span className="text-sm font-bold text-white block mt-0.5">{bus.routeId?.routeName || 'None'}</span>
            </div>

            {/* Broadcast status */}
            <div className="p-3.5 bg-black rounded-xl border border-yellow-500/30">
              <span className="block text-[10px] text-zinc-400 font-bold uppercase">Location Broadcast</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`h-2.5 w-2.5 rounded-full ${isTripActive ? 'bg-yellow-400 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="text-xs font-bold text-zinc-200">{simStatusMsg}</span>
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

              {/* GPS Mode Diagnostics & Telemetry HUD */}
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
                        {gpsTelemetry.isTesting ? 'Pinging GPS...' : 'Test Device Fix'}
                      </button>
                    )}
                  </div>

                  {gpsTelemetry.latitude !== null ? (
                    <div className="bg-black p-2.5 rounded-lg border border-yellow-500/30 font-mono text-[10px] space-y-1">
                      <div className="flex justify-between text-zinc-300">
                        <span>Lat / Lng:</span>
                        <span className="text-yellow-400 font-bold">{gpsTelemetry.latitude?.toFixed(5)}°, {gpsTelemetry.longitude?.toFixed(5)}°</span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>Accuracy:</span>
                        <span className="text-yellow-400 font-bold">±{gpsTelemetry.accuracy} meters</span>
                      </div>
                      {gpsTelemetry.speed !== null && (
                        <div className="flex justify-between text-zinc-300">
                          <span>Ground Speed:</span>
                          <span className="text-yellow-400 font-bold">{gpsTelemetry.speed} km/h</span>
                        </div>
                      )}
                      <div className="flex justify-between text-zinc-500 text-[9px]">
                        <span>Last Sensor Sync:</span>
                        <span>{gpsTelemetry.lastPing || 'Active'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-zinc-400 bg-black/40 p-2.5 rounded-lg border border-zinc-800 flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span>Click Start or "Test Device Fix" to lock your physical GPS coordinates.</span>
                    </div>
                  )}

                  {gpsTelemetry.error && (
                    <div className="p-2 bg-red-950/40 border border-red-500/50 text-red-300 rounded-lg text-[10px] flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{gpsTelemetry.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          {/* Trip Control Button */}
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

          <p className="mt-3 text-center text-[10px] text-zinc-400 font-medium">
            {isTripActive
              ? 'Trip is running. Broadcasting GPS coordinates along the stops in real-time.'
              : 'Click Start to open Socket channels and share your bus location with passengers.'}
          </p>
        </div>
      </div>

      {/* Driver Map Preview */}
      <div className="flex-1 bg-[#121214] p-6 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col justify-between overflow-hidden text-left">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Compass className="h-5 w-5 text-yellow-400" />
            Duty Path Tracker Map
          </h3>
          <span className="text-xs text-zinc-400 font-bold">
            Total Stops: <strong className="text-yellow-400">{bus.routeId?.stops.length || 0}</strong>
          </span>
        </div>

        <div className="flex-1 min-h-[300px]">
          <Map
            activeBusLocation={isTripActive ? simLocation : null}
            routeStops={bus.routeId?.stops || []}
          />
        </div>

        {bus.routeId && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
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
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-red-500 animate-bounce" />
            Passenger Delay Notifications ({lateNotices.length})
          </h4>
          {lateNotices.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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
              No delay notifications received.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
