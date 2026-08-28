import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { busService, routeService, authService } from '../services/api';
import Map from '../components/Map';
import {
  Navigation,
  Clock,
  MapPin,
  Search,
  Bus as BusIcon,
  CreditCard,
  QrCode,
  CheckCircle,
  AlertTriangle,
  GraduationCap,
  Calendar,
  X,
  FileText,
  Download,
  Check,
  Bell,
  Send,
  Radio,
  Volume2,
  VolumeX,
  Smartphone,
  Target,
  Zap,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, setUser } = useAuth();
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);
  const [trackingLocation, setTrackingLocation] = useState(null);
  const [selectedStop, setSelectedStop] = useState(null);
  const [eta, setEta] = useState(null);

  const [activeSubTab, setActiveSubTab] = useState('map-tracker'); // map-tracker, digital-pass, plans, billing
  const [passLoading, setPassLoading] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Dummy Payment Gateway States
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanForPay, setSelectedPlanForPay] = useState(null); // { name, price }
  const [paymentStep, setPaymentStep] = useState('form'); // form, processing, success
  const [cardDetails, setCardDetails] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [processingMsg, setProcessingMsg] = useState('');
  const [selectedSubRoute, setSelectedSubRoute] = useState('Route 17 - Margao Line');

  // Late notification states
  const [isLatePanelOpen, setIsLatePanelOpen] = useState(false);
  const [lateMinutes, setLateMinutes] = useState('5');
  const [lateSent, setLateSent] = useState(false);

  // Proximity Geofence Alert States
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [geofenceRadius, setGeofenceRadius] = useState(1000); // meters: 500, 1000, 2000
  const [geofenceSound, setGeofenceSound] = useState(true);
  const [geofenceVibrate, setGeofenceVibrate] = useState(true);
  const [geofenceAlert, setGeofenceAlert] = useState(null); // { busNumber, stopName, distanceMeters, timeMins, timestamp }
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const hasAlertedRef = useRef(false);

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

  const basePrice = routePrices[selectedSubRoute] || 30000;
  const monthlyPrice = Math.floor(basePrice / 10);
  const semesterPrice = Math.floor(basePrice / 2);
  const annualPrice = basePrice;

  const socketRef = useRef(null);

  // Haversine formula to calculate distance in km
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch initial buses and routes
  const fetchData = async () => {
    try {
      const busRes = await busService.getBuses();
      const routeRes = await routeService.getRoutes();
      if (busRes.success) setBuses(busRes.data);
      if (routeRes.success) setRoutes(routeRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Socket connection for live bus tracking
  useEffect(() => {
    if (selectedBus) {
      const socketServerUrl = import.meta.env.VITE_SOCKET_URL || 
        (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : null) || 
        (window.location.hostname === 'localhost' ? 'http://localhost:5001' : `http://${window.location.hostname}:5001`);
      
      socketRef.current = io(socketServerUrl);
      socketRef.current.emit('joinBus', { busId: selectedBus._id });

      socketRef.current.on('busLocation', ({ lat, lng, busId, busNumber }) => {
        setTrackingLocation({
          busId: busId || selectedBus._id,
          busNumber: busNumber || selectedBus.busNumber,
          lat,
          lng,
        });
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [selectedBus]);

  // Recalculate ETA whenever trackingLocation or selectedStop changes
  useEffect(() => {
    if (trackingLocation && selectedStop) {
      const dist = getDistance(
        trackingLocation.lat,
        trackingLocation.lng,
        selectedStop.lat,
        selectedStop.lng
      );
      
      const speedKmh = 30; // avg bus speed
      const timeHours = dist / speedKmh;
      const timeMins = Math.round(timeHours * 60);

      setEta({
        distance: dist.toFixed(2),
        minutes: timeMins < 1 ? 'Less than 1' : timeMins,
      });
    } else {
      setEta(null);
    }
  }, [trackingLocation, selectedStop]);

  // Web Audio synthesizer chime for proximity radar alert
  const playProximityChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // 3-tone retro synth chord progression (E5 -> G#5 -> B5)
      const tones = [659.25, 830.61, 987.77];
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
      });
    } catch (err) {
      console.error('Audio chime error:', err);
    }
  };

  // Request browser Web Notification permissions
  const requestNotificationPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('📡 TransitX Proximity Radar Active', {
          body: 'Proximity Geofence alerts are now armed. You will be notified when your bus approaches!',
          icon: '/logo.svg',
        });
      }
    } catch (e) {
      console.error('Notification permission error:', e);
    }
  };

  // Test sample alert immediately
  const handleTestProximityAlert = () => {
    if (geofenceSound) playProximityChime();
    if (geofenceVibrate && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([250, 100, 250, 100, 400]);
    }
    setGeofenceAlert({
      busNumber: selectedBus?.busNumber || 'GA-08-F-1234',
      stopName: selectedStop?.name || 'Assigned Campus Stop',
      distanceMeters: Math.round(geofenceRadius * 0.75),
      timeMins: 2,
      timestamp: new Date().toLocaleTimeString(),
    });
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`🚌 Bus Approaching Alert (Test)`, {
          body: `Bus is within your ${geofenceRadius}m geofence perimeter! (~2 min ETA)`,
          icon: '/logo.svg',
          tag: 'transitx-geofence-test',
        });
      } catch (err) {
        console.error('Web notification error:', err);
      }
    }
  };

  // Geofence Proximity Alert Trigger Effect
  useEffect(() => {
    if (!geofenceEnabled || !trackingLocation || !selectedStop || !selectedBus || selectedBus.status !== 'active') {
      return;
    }

    const distKm = getDistance(
      trackingLocation.lat,
      trackingLocation.lng,
      selectedStop.lat,
      selectedStop.lng
    );
    const distMeters = Math.round(distKm * 1000);
    const speedKmh = 30;
    const timeMins = Math.max(1, Math.round((distKm / speedKmh) * 60));

    // If within radius and hasn't alerted for this approach
    if (distMeters <= geofenceRadius && !hasAlertedRef.current) {
      hasAlertedRef.current = true;
      const alertPayload = {
        busNumber: selectedBus.busNumber,
        stopName: selectedStop.name,
        distanceMeters: distMeters,
        timeMins,
        timestamp: new Date().toLocaleTimeString(),
      };
      setGeofenceAlert(alertPayload);

      // Play Sound Chime
      if (geofenceSound) {
        playProximityChime();
      }

      // Trigger Haptic Vibration on Mobile
      if (geofenceVibrate && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([250, 100, 250, 100, 400]);
      }

      // Trigger Native Web Notification (even if tab is minimized)
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(`🚌 Bus ${selectedBus.busNumber} is Approaching!`, {
            body: `Now ${distMeters}m away from ${selectedStop.name} (~${timeMins} min ETA). Be ready at the stop!`,
            icon: '/logo.svg',
            badge: '/logo.svg',
            tag: 'transitx-geofence',
          });
        } catch (err) {
          console.error('Web notification error:', err);
        }
      }
    } else if (distMeters > geofenceRadius * 1.5) {
      // Reset alert trigger once the bus has moved past/away
      hasAlertedRef.current = false;
    }
  }, [trackingLocation, selectedStop, geofenceEnabled, geofenceRadius, selectedBus, geofenceSound, geofenceVibrate]);

  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
    hasAlertedRef.current = false;
    setGeofenceAlert(null);
    setTrackingLocation({
      busId: bus._id,
      busNumber: bus.busNumber,
      lat: bus.currentLocation.lat,
      lng: bus.currentLocation.lng,
    });
    if (bus.routeId && bus.routeId.stops.length > 0) {
      setSelectedStop(bus.routeId.stops[bus.routeId.stops.length - 1]);
    } else {
      setSelectedStop(null);
    }
  };

  // Open checkout modal
  const handleOpenCheckout = (planName, price) => {
    console.log('handleOpenCheckout called with:', planName, price);
    setSelectedPlanForPay({ name: planName, price });
    setCardDetails({ name: '', number: '', expiry: '', cvv: '' });
    setPaymentStep('form');
    setCheckoutModalOpen(true);
  };

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails({ ...cardDetails, number: formatted.substring(0, 19) });
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = value;
    if (value.length > 2) {
      formatted = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
    }
    setCardDetails({ ...cardDetails, expiry: formatted.substring(0, 5) });
  };

  // Process Mock Payment
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setPaymentStep('processing');

    const steps = [
      'Establishing secure 256-bit SSL connection...',
      'Encrypting card details via RSA token...',
      'Validating transaction with bank host...',
      'Awaiting 3D-Secure response verification...',
      'Completing transaction capture...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingMsg(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    try {
      const res = await authService.updatePass(
        selectedPlanForPay.name,
        selectedPlanForPay.price,
        selectedSubRoute
      );
      if (res.success) {
        setUser(res.data);
        setPaymentStep('success');
      } else {
        throw new Error(res.message || 'Payment was declined by card issuer.');
      }
    } catch (err) {
      alert(err.message || 'Error processing payment.');
      setPaymentStep('form');
    }
  };

  // Emit late notification to the driver
  const handleSendLateNotice = () => {
    if (socketRef.current && selectedBus) {
      socketRef.current.emit('lateNotice', {
        busId: selectedBus._id,
        studentName: user.name,
        rollNumber: user.rollNumber || 'N/A',
        delayMinutes: lateMinutes,
        stopName: selectedStop ? selectedStop.stopName : 'Assigned Stop'
      });
      setLateSent(true);
      setTimeout(() => {
        setLateSent(false);
        setIsLatePanelOpen(false);
      }, 3000);
    }
  };

  const filteredBuses = buses.filter((bus) => {
    const query = searchQuery.toLowerCase();
    const matchesNumber = bus.busNumber.toLowerCase().includes(query);
    const matchesRoute = bus.routeId?.routeName.toLowerCase().includes(query) || false;
    return matchesNumber || matchesRoute;
  });

  const isPassActive = user?.passStatus === 'active';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Title */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <GraduationCap className="h-8 w-8 text-sky-600 mr-2" />
            Student Space
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Department: <span className="font-semibold text-gray-700">{user?.department || 'N/A'}</span> | Roll No:{' '}
            <span className="font-semibold text-gray-700">{user?.rollNumber || 'N/A'}</span>
          </p>
        </div>

        {/* Pass Status Badge */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
          <CreditCard className="h-5 w-5 text-sky-600" />
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase leading-none">Pass Status</span>
            <span
              className={`text-xs font-extrabold capitalize ${
                isPassActive ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {isPassActive ? '● Active' : '● Inactive / Expired'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSubTab('map-tracker')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm ${
              activeSubTab === 'map-tracker'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Live Bus Map
          </button>
          <button
            onClick={() => setActiveSubTab('digital-pass')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm ${
              activeSubTab === 'digital-pass'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Digital Pass
          </button>
          <button
            onClick={() => setActiveSubTab('plans')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm ${
              activeSubTab === 'plans'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bus Plans Subscriptions
          </button>
          <button
            onClick={() => setActiveSubTab('billing')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm ${
              activeSubTab === 'billing'
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Billing & Receipts
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 flex flex-col">
        {/* PANEL 1: LIVE MAP TRACKING */}
        {activeSubTab === 'map-tracker' && (
          <div className="flex-1 flex flex-col md:flex-row gap-6">
            {/* Search sidebar */}
            <div className="w-full md:w-80 flex flex-col h-full bg-white p-5 rounded-lg border border-gray-200 shadow-sm shrink-0">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Navigation className="h-5 w-5 text-sky-600 mr-1.5" />
                Select Campus Bus
              </h2>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search route or bus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 text-sm"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 max-h-[350px] md:max-h-[500px]">
                {filteredBuses.map((bus) => {
                  const isSelected = selectedBus?._id === bus._id;
                  const isRunning = bus.status === 'active';

                  return (
                    <div
                      key={bus._id}
                      onClick={() => handleSelectBus(bus)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-900 flex items-center text-sm">
                          <BusIcon className="h-4 w-4 text-sky-600 mr-1.5" />
                          {bus.busNumber}
                        </h4>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isRunning ? 'Running' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 truncate">
                        {bus.routeId?.routeName || 'No Assigned Route'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tracking map details */}
            <div className="flex-1 bg-white p-5 rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              {selectedBus ? (
                <div className="flex-1 flex flex-col h-full">
                  <div className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="p-3.5 bus-led-sign text-left shrink-0 w-full sm:w-auto">
                      <div className="text-[9px] font-bold text-amber-500 opacity-80 leading-none">ROUTE BOARD</div>
                      <h3 className="text-base font-black mt-1 flex items-center gap-1.5">
                        <BusIcon className="h-4.5 w-4.5 text-amber-500" />
                        {selectedBus.busNumber}
                      </h3>
                      <span className="block text-[11px] font-bold text-amber-400/90 truncate max-w-xs mt-0.5">
                        {selectedBus.routeId?.routeName || 'No route assigned'}
                      </span>
                    </div>

                    {selectedBus.routeId && (
                      <div className="text-right">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Calculate ETA To</label>
                        <select
                          value={selectedStop?.name || ''}
                          onChange={(e) => {
                            const stop = selectedBus.routeId.stops.find((s) => s.name === e.target.value);
                            setSelectedStop(stop);
                          }}
                          className="mt-0.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-sky-500"
                        >
                          {selectedBus.routeId.stops.map((stop) => (
                            <option key={stop._id} value={stop.name}>
                              {stop.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {selectedBus.status === 'active' && eta ? (
                    <>
                      <div className="mb-4 grid grid-cols-2 gap-4 bg-sky-50 border border-sky-100 p-4 rounded-lg text-sky-900">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-sky-600" />
                          <div>
                            <span className="block text-[10px] font-bold text-sky-500 uppercase leading-none">Estimated Arrival</span>
                            <span className="text-lg font-black">{eta.minutes} mins</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-sky-600" />
                          <div>
                            <span className="block text-[10px] font-bold text-sky-500 uppercase leading-none">Distance Remaining</span>
                            <span className="text-lg font-black">{eta.distance} km</span>
                          </div>
                        </div>
                      </div>

                      {/* Late notification panel */}
                      <div className="mb-4 bg-slate-900 border border-slate-800 rounded-lg p-3">
                        {!isLatePanelOpen ? (
                          <button
                            onClick={() => setIsLatePanelOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/40 hover:bg-red-900/30 border border-red-900/30 rounded text-red-400 text-xs font-bold transition-colors"
                          >
                            <Bell className="h-4 w-4" />
                            Notify Driver: I'm Running Late
                          </button>
                        ) : (
                          <div className="space-y-2.5 text-left">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">REPORT DELAY AT STOP</span>
                              <button
                                onClick={() => setIsLatePanelOpen(false)}
                                className="text-[10px] font-bold text-slate-500 hover:text-slate-350"
                              >
                                Cancel
                              </button>
                            </div>
                            
                            {lateSent ? (
                              <div className="py-1.5 px-3 bg-green-950/30 border border-green-900/30 text-green-400 rounded text-xs font-bold text-center flex items-center justify-center gap-1.5">
                                <CheckCircle className="h-4 w-4" />
                                Late notice sent to driver!
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <select
                                  value={lateMinutes}
                                  onChange={(e) => setLateMinutes(e.target.value)}
                                  className="flex-1 py-1 px-2 border border-slate-800 bg-slate-950 text-xs text-white rounded font-bold"
                                >
                                  <option value="5">Delay: 5 mins</option>
                                  <option value="10">Delay: 10 mins</option>
                                  <option value="15">Delay: 15 mins</option>
                                </select>
                                <button
                                  onClick={handleSendLateNotice}
                                  className="py-1 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow transition-colors"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                  Send
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : selectedBus.status !== 'active' ? (
                    <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-lg text-xs font-medium">
                      ⚠️ This bus is not running active duty shifts right now. Showing last coordinates.
                    </div>
                  ) : (
                    <div className="mb-4 bg-gray-50 border border-gray-200 p-3 text-center text-xs text-gray-500">
                      Connecting to live stream...
                    </div>
                  )}

                  {/* ACTIVE PROXIMITY GEOFENCE ALERT BANNER */}
                  {geofenceAlert && (
                    <div className="mb-4 p-4 bg-[#090014] border-2 border-[#00FFFF] shadow-[0_0_25px_rgba(0,255,255,0.4)] animate-pulse rounded-lg text-left flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#00FFFF]/20 border border-[#00FFFF] flex items-center justify-center shrink-0">
                          <Radio className="h-5 w-5 text-[#00FFFF] animate-ping" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-[#FF00FF]/30 border border-[#FF00FF] text-[#FF00FF] text-[10px] font-black uppercase tracking-wider">
                              🚨 PROXIMITY ALERT
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{geofenceAlert.timestamp}</span>
                          </div>
                          <h4 className="text-base font-black text-white mt-1">
                            Bus {geofenceAlert.busNumber} is Approaching {geofenceAlert.stopName}!
                          </h4>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Current Distance: <span className="font-bold text-[#00FFFF]">{geofenceAlert.distanceMeters} meters</span> • Estimated Arrival: <span className="font-bold text-[#FF9900]">~{geofenceAlert.timeMins} mins</span>. Please head to your boarding spot now!
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setGeofenceAlert(null)}
                        className="text-slate-400 hover:text-white p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* PROXIMITY GEOFENCE RADAR CONTROLS */}
                  <div className="mb-4 p-3.5 bg-[#090014] border border-[#00FFFF]/30 rounded-lg text-left">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2.5 border-b border-[#00FFFF]/15">
                      <div className="flex items-center gap-2">
                        <Radio className={`h-4 w-4 ${geofenceEnabled ? 'text-[#00FFFF] animate-pulse' : 'text-slate-500'}`} />
                        <div>
                          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            Proximity Geofence Radar
                            {geofenceEnabled && (
                              <span className="px-1.5 py-0.2 bg-[#00FFFF]/20 text-[#00FFFF] text-[9px] font-mono border border-[#00FFFF]/40">
                                ARMED ({geofenceRadius}m)
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Get alerted when bus approaches {selectedStop?.name || 'your stop'}.
                          </span>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = !geofenceEnabled;
                          setGeofenceEnabled(next);
                          if (next && notificationPermission !== 'granted') {
                            requestNotificationPermission();
                          }
                        }}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          geofenceEnabled
                            ? 'bg-[#00FFFF] text-black border-[#00FFFF] shadow-[0_0_12px_rgba(0,255,255,0.4)]'
                            : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {geofenceEnabled ? 'Radar Active' : 'Arm Radar'}
                      </button>
                    </div>

                    {geofenceEnabled && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                        {/* Radius Selector */}
                        <div className="bg-black/50 p-2 border border-slate-800 flex flex-col justify-between">
                          <span className="text-slate-400 font-bold uppercase block mb-1">Alert Perimeter</span>
                          <div className="flex gap-1">
                            {[500, 1000, 2000].map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => {
                                  setGeofenceRadius(r);
                                  hasAlertedRef.current = false;
                                }}
                                className={`flex-1 py-1 text-center font-mono font-bold border ${
                                  geofenceRadius === r
                                    ? 'border-[#00FFFF] text-[#00FFFF] bg-[#00FFFF]/10'
                                    : 'border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Audio & Haptics */}
                        <div className="bg-black/50 p-2 border border-slate-800 flex flex-col justify-between">
                          <span className="text-slate-400 font-bold uppercase block mb-1">Feedback Engine</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setGeofenceSound(!geofenceSound)}
                              className={`flex-1 py-1 flex items-center justify-center gap-1 border font-bold ${
                                geofenceSound
                                  ? 'border-[#FF00FF] text-[#FF00FF] bg-[#FF00FF]/10'
                                  : 'border-slate-800 text-slate-500'
                              }`}
                            >
                              {geofenceSound ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                              Chime
                            </button>
                            <button
                              type="button"
                              onClick={() => setGeofenceVibrate(!geofenceVibrate)}
                              className={`flex-1 py-1 flex items-center justify-center gap-1 border font-bold ${
                                geofenceVibrate
                                  ? 'border-[#FF9900] text-[#FF9900] bg-[#FF9900]/10'
                                  : 'border-slate-800 text-slate-500'
                              }`}
                            >
                              <Smartphone className="h-3 w-3" />
                              Vibrate
                            </button>
                          </div>
                        </div>

                        {/* Browser Notification & Test */}
                        <div className="bg-black/50 p-2 border border-slate-800 flex flex-col justify-between">
                          <span className="text-slate-400 font-bold uppercase block mb-1">Notification Test</span>
                          <div className="flex gap-1">
                            {notificationPermission !== 'granted' ? (
                              <button
                                type="button"
                                onClick={requestNotificationPermission}
                                className="flex-1 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-[9px] font-bold uppercase"
                              >
                                Allow Web Push
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleTestProximityAlert}
                                className="flex-1 py-1 bg-[#00FFFF]/10 text-[#00FFFF] border border-[#00FFFF]/30 hover:bg-[#00FFFF]/20 text-[9px] font-bold uppercase flex items-center justify-center gap-1"
                              >
                                <Zap className="h-3 w-3" />
                                Test Radar Alert
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-h-[300px]">
                    <Map
                      activeBusLocation={trackingLocation}
                      routeStops={selectedBus.routeId?.stops || []}
                      geofenceCircle={
                        geofenceEnabled && selectedStop
                          ? {
                              lat: selectedStop.lat,
                              lng: selectedStop.lng,
                              radius: geofenceRadius,
                              active: true,
                            }
                          : null
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                  <BusIcon className="h-14 w-14 text-gray-300 animate-pulse mb-3" />
                  <h3 className="text-base font-bold text-gray-700">No Bus Selected</h3>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">
                    Select a bus from the sidebar list to verify its route coordinates and real-time movement.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 2: MY DIGITAL TRANSPORT PASS */}
        {activeSubTab === 'digital-pass' && (
          <div className="max-w-md mx-auto w-full bg-slate-900 p-6 rounded-xl border border-sky-500/30 neon-border-cyan animate-neon-pulse flex flex-col items-center text-center">
            <h2 className="text-xl font-bold text-slate-100 mb-6">Digital Campus Transport Pass</h2>
            
            {isPassActive ? (
              <div className="w-full bus-window-frame p-4 bg-slate-950">
                {/* Visual Pass Card styled like an authentic Bus Ticket */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/90 to-teal-900/90 text-slate-100 p-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] bus-ticket text-left">
                  {/* Watermark Logo */}
                  <div className="absolute right-4 bottom-4 text-emerald-500/10 font-black text-6xl select-none">
                    T-X
                  </div>

                  <div className="flex justify-between items-start border-b border-emerald-800 pb-3 mb-4">
                    <div>
                      <h3 className="font-extrabold text-lg tracking-tight text-emerald-400">TRANSITX TICKET</h3>
                      <span className="text-[10px] text-emerald-300 uppercase tracking-widest font-semibold">
                        College Transport Authorization
                      </span>
                    </div>
                    <CheckCircle className="h-6 w-6 text-emerald-400 fill-emerald-600/10 animate-pulse" />
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="block text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Student Name</span>
                      <span className="font-bold text-base text-white">{user?.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Roll Number</span>
                        <span className="font-bold text-white">{user?.rollNumber}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Department</span>
                        <span className="font-bold text-white">{user?.department}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-emerald-800/40 pt-3">
                      <div>
                        <span className="block text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Plan Subscribed</span>
                        <span className="font-bold text-xs bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/30 inline-block mt-0.5">
                          {user?.passPlan}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Valid Until</span>
                        <span className="font-bold text-xs text-white flex items-center mt-1">
                          <Calendar className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                          {new Date(user?.passValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Perforation Line */}
                  <div className="bus-ticket-perforation" />

                  {/* QR code scanner stub */}
                  <div className="flex flex-col items-center pt-2">
                    <div className="qr-code-wrapper p-3 rounded-lg border border-gray-300 shadow-sm flex items-center justify-center bg-white">
                      <QrCode className="h-32 w-32 text-gray-800" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-3">
                      QR ID: TX-PASS-{user?._id?.substring(18)}
                    </span>
                    <p className="text-[11px] text-emerald-300/80 mt-2 font-medium text-center max-w-xs">
                      Scan ticket stub upon boarding at campus shuttles gates.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 px-4 flex flex-col items-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-gray-900">No Active Pass</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-sm">
                  You do not have an active transport pass. Please visit the **Bus Plans** tab to subscribe to a semester, monthly, or annual plan to activate your digital card.
                </p>
                <button
                  onClick={() => setActiveSubTab('plans')}
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-sky-600 hover:bg-sky-700 shadow-md transition-colors"
                >
                  View Subscription Plans
                </button>
              </div>
            )}
          </div>
        )}

        {/* PANEL 3: BUS PLANS SUBSCRIPTIONS */}
        {activeSubTab === 'plans' && (
          <div className="max-w-5xl mx-auto w-full text-slate-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-white">Choose Your Transport Plan</h2>
              <p className="text-sm text-slate-400 mt-1">Activate your digital bus pass instantly with mock subscription payments.</p>
            </div>

            {/* Route Pricing Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 max-w-xl mx-auto text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Select Route for Pricing</h4>
                <p className="text-[11px] text-slate-400">Longer distances (e.g. Mapusa/Marcel) cost more due to route mileage.</p>
              </div>
              <select
                value={selectedSubRoute}
                onChange={(e) => setSelectedSubRoute(e.target.value)}
                className="w-full sm:w-64 py-1.5 px-3 border border-slate-800 bg-slate-950 rounded text-xs text-white font-bold focus:ring-1 focus:ring-sky-500"
              >
                {routes.map((r) => {
                  const price = routePrices[r.routeName] || 30000;
                  return (
                    <option key={r._id} value={r.routeName}>
                      {r.routeName} (₹{price.toLocaleString()} PA)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Monthly Plan */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-6 flex flex-col justify-between hover:border-slate-700 transition-all relative overflow-hidden">
                <div>
                  <h3 className="text-lg font-bold text-white">Monthly Pass</h3>
                  <p className="text-xs text-slate-400 mt-1">Best for short temporary terms</p>
                  
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-extrabold text-white">₹{monthlyPrice.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 font-semibold ml-1">/ month</span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-350">
                    <li className="flex items-center font-medium">
                      <span className="text-green-400 mr-2 font-bold">✓</span> Valid for exactly 30 days
                    </li>
                    <li className="flex items-center font-medium">
                      <span className="text-green-400 mr-2 font-bold">✓</span> Access to all route lines
                    </li>
                    <li className="flex items-center font-medium">
                      <span className="text-green-400 mr-2 font-bold">✓</span> Real-time Leaflet tracking
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleOpenCheckout('Monthly Pass', monthlyPrice)}
                  className="mt-8 w-full py-2.5 rounded-lg border border-sky-500/30 bg-sky-950/20 hover:bg-sky-950/40 text-sky-400 text-xs font-bold transition-all"
                >
                  Subscribe Monthly
                </button>
              </div>

              {/* Semester Plan (Popular) */}
              <div className="bg-slate-900 rounded-xl border-2 border-sky-500 shadow-xl p-6 flex flex-col justify-between hover:border-sky-400 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-sky-500 text-white text-[9px] font-black uppercase tracking-wider py-1 px-3.5 rounded-bl">
                  Popular Choice
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">Semester Pass</h3>
                  <p className="text-xs text-slate-400 mt-1">Perfect fit for full semesters</p>
                  
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-extrabold text-white">₹{semesterPrice.toLocaleString()}</span>
                    <span className="text-xs text-slate-450 font-semibold ml-1">/ semester</span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-350">
                    <li className="flex items-center font-medium">
                      <span className="text-green-400 mr-2 font-bold">✓</span> Valid for 180 days (6 months)
                    </li>
                    <li className="flex items-center font-medium">
                      <span className="text-green-400 mr-2 font-bold">✓</span> Unlimited boarding access
                    </li>
                    <li className="flex items-center font-medium">
                      <span className="text-green-400 mr-2 font-bold">✓</span> Digital pass QR code activation
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleOpenCheckout('Semester Pass', semesterPrice)}
                  className="mt-8 w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow transition-all"
                >
                  Subscribe Semester
                </button>
              </div>

              {/* Annual Plan */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-6 flex flex-col justify-between hover:border-slate-700 transition-all relative overflow-hidden">
                <div>
                  <h3 className="text-lg font-bold text-white">Annual Pass</h3>
                  <p className="text-xs text-slate-400 mt-1">Best value for full year</p>
                  
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-extrabold text-white">₹{annualPrice.toLocaleString()}</span>
                    <span className="text-xs text-slate-455 font-semibold ml-1">/ year</span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-350">
                    <li className="flex items-center font-medium">
                      <span className="text-green-400 mr-2 font-bold">✓</span> Valid for 365 days (1 year)
                    </li>
                    <li className="flex items-center font-medium">
                      <span className="text-green-400 mr-2 font-bold">✓</span> Save ₹3,000 vs monthly rates
                    </li>
                    <li className="flex items-center font-medium">
                      <span className="text-green-400 mr-2 font-bold">✓</span> Priority customer support
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleOpenCheckout('Annual Pass', annualPrice)}
                  className="mt-8 w-full py-2.5 rounded-lg border border-sky-500/30 bg-sky-950/20 hover:bg-sky-950/40 text-sky-400 text-xs font-bold transition-all"
                >
                  Subscribe Annual
                </button>
              </div>

            </div>
          </div>
        )}

        {/* PANEL 4: BILLING & RECEIPTS HISTORY */}
        {activeSubTab === 'billing' && (
          <div className="max-w-5xl mx-auto w-full text-slate-100 flex-1 flex flex-col">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-white">Billing & Payments History</h2>
              <p className="text-sm text-slate-400 mt-1">Review your current subscription plan details and access downloadable payment receipts.</p>
            </div>

            {/* Current Active Plan Status Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 text-left grid grid-cols-1 md:grid-cols-3 gap-6 shadow-lg">
              <div className="flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1.5">Current plan</span>
                  <h3 className="text-xl font-extrabold text-white">{user?.passPlan || 'No Active Pass Plan'}</h3>
                </div>
                <div className="mt-4">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">VALIDITY PERIOD</span>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {user?.passValidUntil ? (
                      <>Valid until {new Date(user.passValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
              </div>

              <div className="border-l border-slate-800/80 pl-6 flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1.5">Active Pass Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold leading-none ${
                    user?.passStatus === 'active' ? 'bg-green-950/40 text-green-400 border border-green-900/30' : 'bg-slate-950/40 text-slate-400 border border-slate-800'
                  }`}>
                    {user?.passStatus === 'active' ? '● Active' : '● Inactive / Expired'}
                  </span>
                </div>
                <div className="mt-4">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">AUTHORIZED GATEWAYS</span>
                  <p className="text-xs text-slate-400 mt-0.5">TransitX Mock SSL Gateway</p>
                </div>
              </div>

              <div className="border-l border-slate-800/80 pl-6 flex flex-col justify-center gap-3">
                <button
                  onClick={() => setActiveSubTab('plans')}
                  className="w-full py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Renew / Change Pass Plan
                </button>
                <button
                  onClick={() => setActiveSubTab('digital-pass')}
                  className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shadow-md transition-colors"
                >
                  View Digital Card QR
                </button>
              </div>
            </div>

            {/* Payment Receipts History Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex-1">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Payment Transaction History</h4>
                <span className="text-[10px] bg-sky-950/40 border border-sky-900/30 text-sky-400 px-2 py-0.5 rounded font-black">
                  {user?.paymentHistory?.length || 0} Transactions
                </span>
              </div>

              {user?.paymentHistory && user.paymentHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Transaction ID</th>
                        <th className="px-6 py-3 font-semibold">Date</th>
                        <th className="px-6 py-3 font-semibold">Plan</th>
                        <th className="px-6 py-3 font-semibold">Route Line</th>
                        <th className="px-6 py-3 font-semibold text-right">Amount</th>
                        <th className="px-6 py-3 font-semibold text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/25">
                      {user.paymentHistory.map((t) => (
                        <tr key={t.transactionId} className="hover:bg-slate-800/25 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-sky-400">{t.transactionId}</td>
                          <td className="px-6 py-4">
                            {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4 font-bold text-white">{t.planName}</td>
                          <td className="px-6 py-4 text-slate-400 font-semibold">{t.route}</td>
                          <td className="px-6 py-4 font-extrabold text-white text-right">₹{t.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedReceipt(t);
                                setReceiptModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-950/40 hover:bg-sky-900/40 text-sky-400 border border-sky-900/30 rounded font-bold text-[11px] transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 font-semibold text-xs flex flex-col items-center">
                  <FileText className="h-12 w-12 text-slate-700 mb-2" />
                  <span>No payment transactions found.</span>
                  <p className="text-[10px] text-slate-600 mt-1 max-w-xs">Once you purchase a pass plan using the subscription checkout portal, your tax invoices and receipts will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal Form Overlay */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl max-w-2xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col md:flex-row min-h-[450px]">
            
            {/* Left Column: Order Summary */}
            <div className="w-full md:w-80 bg-slate-950 border-r border-slate-850 p-6 flex flex-col justify-between shrink-0 text-left">
              <div>
                <span className="block text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1">
                  Secure Checkout
                </span>
                <h3 className="text-xl font-black text-white mb-6">Order Summary</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-start text-sm pb-3 border-b border-slate-850">
                    <div>
                      <span className="font-bold text-slate-200">{selectedPlanForPay?.name}</span>
                      <span className="block text-[11px] text-slate-500 font-semibold mt-0.5">Transit Authorization Pass</span>
                    </div>
                    <span className="font-extrabold text-white">₹{selectedPlanForPay?.price?.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                    <span>Processing Fee</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                    <span>Tax (GST/VAT)</span>
                    <span>₹0.00</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-850 pt-4 mt-6">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-400">Total Amount</span>
                  <span className="text-2xl font-black text-sky-400">₹{selectedPlanForPay?.price?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Form / Progress / Success states */}
            <div className="flex-1 p-6 relative flex flex-col justify-between text-left">
              
              {/* Close Button (only active if not processing) */}
              {paymentStep !== 'processing' && (
                <button
                  onClick={() => setCheckoutModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-450 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              {/* Step 1: Form View */}
              {paymentStep === 'form' && (
                <form onSubmit={handleProcessPayment} className="space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white mb-4 flex items-center gap-1.5">
                      <CreditCard className="h-5 w-5 text-sky-400" />
                      Card Payment Details
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 text-slate-400 uppercase">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                          placeholder="e.g. Alex Student"
                          className="mt-1 block w-full border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-950 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 text-slate-400 uppercase">Card Number</label>
                        <input
                          type="text"
                          required
                          value={cardDetails.number}
                          onChange={handleCardNumberChange}
                          placeholder="1111 2222 3333 4444"
                          className="mt-1 block w-full border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-950 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-455 text-slate-400 uppercase">Expiry Date</label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={handleExpiryChange}
                            className="mt-1 block w-full border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-950 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-455 text-slate-400 uppercase">CVV</label>
                          <input
                            type="password"
                            required
                            placeholder="•••"
                            maxLength="3"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })}
                            className="mt-1 block w-full border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-950 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md mt-6 transition-colors"
                  >
                    Authorize Payment — ₹{selectedPlanForPay?.price?.toLocaleString()}
                  </button>
                </form>
              )}

              {/* Step 2: Processing View */}
              {paymentStep === 'processing' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-400 mb-6"></div>
                  <h4 className="text-base font-bold text-white mb-2">Authorizing Transaction</h4>
                  <p className="text-xs text-sky-400 font-bold animate-pulse">{processingMsg}</p>
                  <p className="text-[10px] text-slate-500 mt-6 font-semibold">Please do not refresh the window or click back.</p>
                </div>
              )}

              {/* Step 3: Success View */}
              {paymentStep === 'success' && (
                <div className="flex-1 flex flex-col items-center justify-between text-center p-6">
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <CheckCircle className="h-16 w-16 text-green-400 fill-green-400/10 mb-4 animate-bounce" />
                    <h4 className="text-lg font-black text-white">Payment Successful!</h4>
                    <p className="text-xs text-slate-400 mt-1.5 max-w-xs font-semibold">
                      Your student transport pass has been generated and validated in your profile registers.
                    </p>

                    <div className="mt-6 bg-slate-950 border border-slate-850 rounded p-4 text-left w-full text-xs space-y-1.5 font-semibold text-slate-350">
                      <div className="flex justify-between">
                        <span>Receipt ID:</span>
                        <span className="font-extrabold text-white">TX-REC-{Math.floor(100000 + Math.random() * 900000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount Paid:</span>
                        <span className="font-extrabold text-white">₹{selectedPlanForPay?.price?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pass Validated:</span>
                        <span className="font-extrabold text-green-400">Active</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      setActiveSubTab('digital-pass');
                    }}
                    className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-md mt-6 transition-colors"
                  >
                    View My Pass
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Receipt Popup Modal */}
      {receiptModalOpen && selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 relative text-left" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
            
            <button
              onClick={() => {
                setReceiptModalOpen(false);
                setSelectedReceipt(null);
              }}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-650 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center pb-6 border-b border-dashed border-slate-200">
              <div className="inline-flex items-center gap-1.5 text-sky-600 font-black text-xl mb-1 tracking-tight">
                <BusIcon className="h-6 w-6 text-sky-500" />
                Transit<span>X</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Payment Tax Invoice</p>
            </div>

            {/* Receipt Body */}
            <div className="py-5 space-y-4">
              
              {/* Institution and Student Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Provider</span>
                  <span className="font-extrabold text-slate-800">Parul University Goa Campus</span>
                  <span className="block text-[10px] text-slate-500 font-medium">Betul, Quitol, South Goa, India</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Billed To</span>
                  <span className="font-extrabold text-slate-800">{user?.name}</span>
                  <span className="block text-[10px] text-slate-500 font-medium">Roll: {user?.rollNumber || 'N/A'}</span>
                </div>
              </div>

              {/* Transaction specifics */}
              <div className="border border-slate-150 rounded-xl p-4 space-y-2 text-xs animate-none" style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Transaction Reference:</span>
                  <span className="font-mono font-extrabold text-slate-900">{selectedReceipt.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Date & Time:</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(selectedReceipt.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Payment Gateway:</span>
                  <span className="font-semibold text-slate-700">Mock Secured SSL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Payment Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-green-600">
                    <Check className="h-3 w-3" /> SUCCESS
                  </span>
                </div>
              </div>

              {/* Item details */}
              <div className="border-t border-slate-100 pt-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Invoice Particulars</span>
                <div className="flex justify-between text-xs py-1.5 border-b border-slate-100">
                  <div className="font-bold text-slate-800">
                    {selectedReceipt.planName}
                    <span className="block text-[10px] text-slate-400 font-medium">{selectedReceipt.route}</span>
                  </div>
                  <span className="font-extrabold text-slate-800">₹{selectedReceipt.amount.toLocaleString()}</span>
                </div>
                
                {/* Total Calculations */}
                <div className="space-y-1.5 pt-3">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Subtotal:</span>
                    <span>₹{selectedReceipt.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Tax (GST @0%):</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-150 pt-2">
                    <span>Total Paid (INR):</span>
                    <span>₹{selectedReceipt.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Receipt Footer */}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              {/* PAID Badge */}
              <div className="border-2 border-green-500/80 text-green-500/80 px-4 py-1.5 rounded font-black text-sm tracking-widest rotate-[-5deg]">
                PAID
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 hover:bg-slate-200"
                  style={{ backgroundColor: '#f1f5f9', color: '#334155' }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Print Receipt
                </button>
                <button
                  onClick={() => {
                    setReceiptModalOpen(false);
                    setSelectedReceipt(null);
                  }}
                  className="px-3.5 py-1.5 bg-sky-650 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors"
                  style={{ backgroundColor: '#0284c7' }}
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
