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

    if (trackingMode === 'gps') {
      startGpsTracking();
    } else {
      setSimStatusMsg('Querying road routes API...');
      const stops = bus.routeId.stops;
      const coordString = stops.map((s) => `${s.lng},${s.lat}`).join(';');

      fetch(`https://router.project-os-rm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`)
        .then((res) => {
          if (!res.ok) throw new Error('OSRM error');
          return res.json();
        })
        .then((data) => {
          if (data.routes && data.routes.length > 0) {
            const roadPoints = data.routes[0].geometry.coordinates.map((coord) => ({
              lat: coord[1],
              lng: coord[0],
            }));
            runSimulationWithPath(roadPoints);
          } else {
            throw new Error('No OSRM routes');
          }
        })
        .catch((err) => {
          fetch(`https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`)
            .then((res) => res.json())
            .then((data) => {
              if (data.routes && data.routes.length > 0) {
                const roadPoints = data.routes[0].geometry.coordinates.map((coord) => ({
                  lat: coord[1],
                  lng: coord[0],
                }));
                runSimulationWithPath(roadPoints);
              } else {
                throw new Error('No routes');
              }
            })
            .catch((e) => {
              console.warn('Fallback to straight line interpolation:', e);
              let path = [];
              const stepsBetweenStops = 10;
              for (let i = 0; i < stops.length - 1; i++) {
                const start = stops[i];
                const end = stops[i + 1];
                const segment = interpolatePoints(start, end, stepsBetweenStops);
                if (i < stops.length - 2) {
                  segment.pop();
                }
                path = [...path, ...segment];
              }
              runSimulationWithPath(path);
            });
        });
    }
  };

  const testDeviceGps = () => {
    if (!navigator.geolocation) {
      setGpsTelemetry(prev => ({ ...prev, error: 'Geolocation API is not supported by your browser.' }));
      return;
    }

    setGpsTelemetry(prev => ({ ...prev, isTesting: true, error: null }));
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed } = position.coords;
        setGpsTelemetry({
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          speed: speed !== null ? Math.round(speed * 3.6) : null,
          lastPing: new Date().toLocaleTimeString(),
          error: null,
          isTesting: false,
        });
      },
      (err) => {
        let msg = 'Could not acquire location.';
        if (err.code === 1) {
          msg = 'Permission Denied: Please tap the lock/info icon in your browser address bar and allow Location.';
        } else if (err.code === 2) {
          msg = 'Position Unavailable: GPS/Network location service is unavailable or turned off.';
        } else if (err.code === 3) {
          msg = 'Timeout: Device GPS timed out. Trying standard accuracy...';
        }
        setGpsTelemetry(prev => ({ ...prev, error: msg, isTesting: false }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const startGpsTracking = () => {
    if (!navigator.geolocation) {
      setSimStatusMsg('GPS not supported on this browser.');
      setGpsTelemetry(prev => ({ ...prev, error: 'Geolocation is not supported.' }));
      stopSimulation();
      return;
    }

    setSimStatusMsg('Acquiring physical GPS lock...');
    setGpsTelemetry(prev => ({ ...prev, error: null }));

    const handleGpsSuccess = (position) => {
      const { latitude, longitude, accuracy, speed } = position.coords;
      console.log(`[GPS UPDATE] Lat: ${latitude}, Lng: ${longitude}, Acc: ${accuracy}m`);

      setGpsTelemetry({
        latitude,
        longitude,
        accuracy: Math.round(accuracy),
        speed: speed !== null ? Math.round(speed * 3.6) : null,
        lastPing: new Date().toLocaleTimeString(),
        error: null,
        isTesting: false,
      });

      // Emit BOTH 'locationUpdate' and 'busLocation' socket events for maximum compatibility
      if (socketRef.current) {
        socketRef.current.emit('locationUpdate', {
          busId: bus._id,
          lat: latitude,
          lng: longitude,
        });
        socketRef.current.emit('busLocation', {
          busId: bus._id,
          lat: latitude,
          lng: longitude,
        });
      }

      // Update local driver map marker
      setSimLocation((prev) => ({
        ...prev,
        busId: bus._id,
        busNumber: bus.busNumber,
        lat: latitude,
        lng: longitude,
      }));

      // Update database status
      busService.updateBus(bus._id, {
        currentLocation: { lat: latitude, lng: longitude },
        status: 'active'
      }).catch(console.error);

      setSimStatusMsg(`Broadcasting GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)} • ±${Math.round(accuracy)}m)`);
    };

    const handleGpsError = (err) => {
      console.error('GPS Watch error:', err);
      let errorMsg = 'GPS acquisition error.';
      if (err.code === 1) {
        errorMsg = 'Permission Denied: Please allow Location in browser address bar settings.';
      } else if (err.code === 2) {
        errorMsg = 'Position Unavailable: Please ensure phone GPS / Location is turned ON.';
      } else if (err.code === 3) {
        errorMsg = 'GPS Timeout: Retrying with standard accuracy...';
        // Fallback retry with standard accuracy
        navigator.geolocation.getCurrentPosition(
          handleGpsSuccess,
          (fallbackErr) => {
            setGpsTelemetry(prev => ({ ...prev, error: 'GPS Timeout: Could not determine location.' }));
            setSimStatusMsg('GPS Timeout: Could not determine location.');
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
        );
        return;
      }
      setGpsTelemetry(prev => ({ ...prev, error: errorMsg }));
      setSimStatusMsg(`GPS Error: ${errorMsg}`);
    };

    // 1. Grab immediate initial fix
    navigator.geolocation.getCurrentPosition(handleGpsSuccess, handleGpsError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    });

    // 2. Stream ongoing position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleGpsSuccess,
      handleGpsError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 2000,
      }
    );
  };

  const runSimulationWithPath = (path) => {
    if (!socketRef.current) return;
    setSimStatusMsg('Broadcasting GPS Location...');

    let currentIndex = 0;

    simIntervalRef.current = setInterval(() => {
      if (!socketRef.current) {
        clearInterval(simIntervalRef.current);
        return;
      }
      if (currentIndex >= path.length) {
        currentIndex = 0;
      }

      const currentCoord = path[currentIndex];
      setSimLocation((prev) => ({
        ...prev,
        lat: currentCoord.lat,
        lng: currentCoord.lng,
      }));

      // Emit locationUpdate event to server
      socketRef.current.emit('locationUpdate', {
        busId: bus._id,
        lat: currentCoord.lat,
        lng: currentCoord.lng,
      });

      const progressPercent = Math.min(100, Math.round(((currentIndex + 1) / path.length) * 100));
      setSimStatusMsg(`Broadcasting GPS Location... (${progressPercent}% of Route Completed)`);

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
    setLateNotices([]); // Clear delay notifications when trip ends
    
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
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-600"></div>
          <span className="text-sm font-medium text-gray-500">Loading your duty files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Issue / Unassigned</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <p className="text-xs text-gray-500 mb-6 max-w-md mx-auto">
          You are registered as an employee, but you have not yet been assigned to a bus by the system administrator. Please request the admin to map your account to a bus in the Admin console.
        </p>
        <button
          onClick={fetchMyBus}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Check Assignment
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6">
      {/* Simulation Controls Panel */}
      <div className="w-full lg:w-96 bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          <span className="block text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            Employee Panel Dashboard
          </span>
          <h2 className="text-2xl font-black text-gray-900 border-b border-gray-100 pb-3">
            {user?.name}
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1.5">
            Role ID: <span className="font-extrabold text-gray-700">{user?.employeeId || 'N/A'}</span> | Post:{' '}
            <span className="font-extrabold text-gray-700">{user?.designation || 'N/A'}</span>
          </p>

          <div className="space-y-3 mt-6 mb-8">
            {/* Shift Card */}
            <div className="p-3.5 bg-sky-50/50 rounded-lg border border-sky-100 flex items-start gap-2.5">
              <Calendar className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] text-sky-600 font-bold uppercase tracking-wider">Assigned Shift (Duty Schedule)</span>
                <span className="text-sm font-bold text-gray-800">
                  {user?.shiftStart} — {user?.shiftEnd} (Mon - Fri)
                </span>
              </div>
            </div>

            {/* Vehicle Card */}
            <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100">
              <span className="block text-[10px] text-gray-400 font-bold uppercase">Bus Assigned</span>
              <span className="text-sm font-bold text-gray-700 block mt-0.5">{bus.busNumber}</span>
              <span className="text-xs text-gray-400 font-semibold block mt-0.5">Capacity: {bus.capacity} seats</span>
            </div>

            {/* Route Card */}
            <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100">
              <span className="block text-[10px] text-gray-400 font-bold uppercase">Assigned Route</span>
              <span className="text-sm font-bold text-gray-750 block mt-0.5">{bus.routeId?.routeName || 'None'}</span>
            </div>

            {/* Broadcast status */}
            <div className="p-3.5 bg-[#090014] border border-[#FF00FF]/25">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Location Broadcast</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`h-2.5 w-2.5 rounded-full ${isTripActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-xs font-bold text-slate-200">{simStatusMsg}</span>
              </div>
            </div>

            {/* Tracking Mode Toggle */}
            <div className="p-3.5 bg-[#090014] border border-[#00FFFF]/25">
              <span className="block text-[10px] text-slate-400 font-bold uppercase mb-2">Tracking Engine Mode</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isTripActive}
                  onClick={() => setTrackingMode('simulated')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    trackingMode === 'simulated'
                      ? 'border-[#00FFFF] bg-[#00FFFF]/10 text-[#00FFFF]'
                      : 'border-[#FF00FF]/30 text-slate-400 hover:text-slate-200'
                  } disabled:opacity-50`}
                >
                  SIMULATION
                </button>
                <button
                  type="button"
                  disabled={isTripActive}
                  onClick={() => setTrackingMode('gps')}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    trackingMode === 'gps'
                      ? 'border-[#00FFFF] bg-[#00FFFF]/10 text-[#00FFFF]'
                      : 'border-[#FF00FF]/30 text-slate-400 hover:text-slate-200'
                  } disabled:opacity-50`}
                >
                  GENUINE GPS
                </button>
              </div>

              {/* GPS Mode Diagnostics & Telemetry HUD */}
              {trackingMode === 'gps' && (
                <div className="mt-3 pt-3 border-t border-[#00FFFF]/20 space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-[#00FFFF] uppercase tracking-wider flex items-center gap-1">
                      <Satellite className="h-3 w-3 text-[#00FFFF] animate-pulse" />
                      Hardware GPS Telemetry
                    </span>
                    {!isTripActive && (
                      <button
                        type="button"
                        onClick={testDeviceGps}
                        disabled={gpsTelemetry.isTesting}
                        className="text-[9px] font-bold uppercase px-2 py-0.5 border border-[#00FFFF]/40 bg-[#00FFFF]/10 text-[#00FFFF] hover:bg-[#00FFFF]/20 transition-all rounded-none"
                      >
                        {gpsTelemetry.isTesting ? 'Pinging GPS...' : 'Test Device Fix'}
                      </button>
                    )}
                  </div>

                  {gpsTelemetry.latitude !== null ? (
                    <div className="bg-black/60 p-2 border border-[#00FFFF]/30 font-mono text-[10px] space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Lat / Lng:</span>
                        <span className="text-[#00FFFF] font-bold">{gpsTelemetry.latitude?.toFixed(5)}°, {gpsTelemetry.longitude?.toFixed(5)}°</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Accuracy:</span>
                        <span className="text-[#34d399] font-bold">±{gpsTelemetry.accuracy} meters</span>
                      </div>
                      {gpsTelemetry.speed !== null && (
                        <div className="flex justify-between text-slate-300">
                          <span>Ground Speed:</span>
                          <span className="text-[#FF9900] font-bold">{gpsTelemetry.speed} km/h</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-400 text-[9px]">
                        <span>Last Sensor Sync:</span>
                        <span>{gpsTelemetry.lastPing || 'Active'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 bg-black/40 p-2 border border-slate-800 flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>Click Start or "Test Device Fix" to lock your physical GPS coordinates.</span>
                    </div>
                  )}

                  {gpsTelemetry.error && (
                    <div className="p-2 bg-red-950/40 border border-[#FF00FF]/50 text-[#FF00FF] text-[10px] flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{gpsTelemetry.error}</span>
                    </div>
                  )}

                  {!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
                    <div className="p-2 bg-amber-950/30 border border-amber-500/40 text-amber-300 text-[9px] leading-tight space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-400">
                        <ShieldAlert className="h-3 w-3 shrink-0" />
                        Insecure Wi-Fi IP Notice:
                      </div>
                      <p>
                        Mobile browsers (Chrome/Safari) restrict GPS access over unencrypted HTTP (non-localhost).
                      </p>
                      <p className="text-amber-200/80">
                        • On Chrome Mobile: Enable <i>chrome://flags/#unsafely-treat-insecure-origin-as-secure</i> with this IP.<br/>
                        • Or use SIMULATION mode to broadcast simulated road movement!
                      </p>
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
            className={`w-full py-4 px-6 font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              isTripActive
                ? 'btn-dashboard-red'
                : 'btn-dashboard-green'
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

          <p className="mt-3 text-center text-[10px] text-gray-500 font-medium">
            {isTripActive
              ? 'Trip is running. Broadcasting GPS coordinates along the stops in real-time.'
              : 'Click Start to open Socket channels and share your bus location with passengers.'}
          </p>
        </div>
      </div>

      {/* Driver Map Preview */}
      <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between overflow-hidden">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Compass className="h-5 w-5 text-sky-600" />
            Duty Path Tracker Map
          </h3>
          <span className="text-xs text-gray-500 font-bold">
            Total Stops: {bus.routeId?.stops.length || 0}
          </span>
        </div>

        <div className="flex-1 min-h-[300px]">
          <Map
            activeBusLocation={isTripActive ? simLocation : null}
            routeStops={bus.routeId?.stops || []}
          />
        </div>

        {bus.routeId && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Route Stop Sequence</h4>
            <div className="flex flex-wrap gap-2">
              {bus.routeId.stops.map((stop, i) => (
                <div
                  key={stop._id}
                  className="flex items-center text-xs bg-gray-100 border border-gray-200 rounded px-2.5 py-1 text-gray-700 font-semibold"
                >
                  <MapPin className="h-3.5 w-3.5 text-sky-600 mr-1 shrink-0" />
                  {i + 1}. {stop.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student Late Notices Feed */}
        <div className="mt-4 pt-4 border-t border-gray-105 border-slate-800">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-red-500 animate-bounce" />
            Passenger Delay Notifications ({lateNotices.length})
          </h4>
          {lateNotices.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {lateNotices.map((notice, idx) => (
                <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-900 flex justify-between items-center animate-pulse">
                  <div>
                    <span className="font-extrabold text-red-950 block">{notice.studentName}</span>
                    <span className="text-[10px] text-red-800 font-medium">Roll: {notice.rollNumber} | Stop: {notice.stopName}</span>
                  </div>
                  <span className="bg-red-200 text-red-850 px-2 py-0.5 rounded font-black text-[10px] uppercase">
                    +{notice.delayMinutes} mins
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-150 rounded text-center text-xs text-gray-400 font-semibold">
              No delay notifications received.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
